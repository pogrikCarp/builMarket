#!/usr/bin/env bash
# Идемпотентный деплой-скрипт buildmarket/domstroy.
# Безопасен для повторного запуска. Управляет собственным systemd-юнитом
# ${SERVICE_NAME}, а также ставит/настраивает nginx (реверс-прокси на порт 80)
# и PostgreSQL - другие процессы/сервисы на сервере не затрагивает.
set -euo pipefail

APP_DIR="/opt/domstroy"
SERVICE_NAME="domstroy"
APP_PORT="4000"
NODE_MAJOR="20"
UNIT_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
DOMAIN_PRIMARY="marketdomstroy.ru"
DOMAIN_WWW="www.marketdomstroy.ru"
CERTBOT_EMAIL="domstroy.dmd@mail.ru"
CERTBOT_WEBROOT="/var/www/certbot"

log() {
  echo "[deploy] $1"
}

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "Этот скрипт должен запускаться от root" >&2
    exit 1
  fi
}

ensure_directory() {
  log "Проверка каталога приложения $APP_DIR"
  mkdir -p "$APP_DIR"
  chown root:root "$APP_DIR"
  chmod 755 "$APP_DIR"
}

ensure_env_file() {
  if [ ! -f "$APP_DIR/.env" ]; then
    log "ОШИБКА: файл $APP_DIR/.env не найден. Он создаётся вручную и не входит в автодеплой."
    exit 1
  fi
}

ensure_dependencies() {
  log "Проверка базовых системных пакетов"
  if ! command -v git >/dev/null 2>&1 || ! command -v rsync >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y ca-certificates curl git build-essential rsync
  fi

  if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q "^v$NODE_MAJOR"; then
    log "Установка Node.js $NODE_MAJOR.x"
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    apt-get install -y nodejs
  else
    log "Node.js уже установлен: $(node -v)"
  fi
}

check_port_conflict() {
  # Порт должен быть либо свободен, либо занят НАШИМ systemd-сервисом.
  # Если порт занят посторонним процессом - останавливаем деплой без вмешательства в чужие процессы.
  if command -v ss >/dev/null 2>&1; then
    local listeners
    listeners=$(ss -ltnp "sport = :${APP_PORT}" 2>/dev/null | tail -n +2 || true)
    if [ -n "$listeners" ]; then
      if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        log "Порт ${APP_PORT} занят нашим сервисом ${SERVICE_NAME} - это ожидаемо, продолжаем."
      else
        log "ОШИБКА: порт ${APP_PORT} занят посторонним процессом, а сервис ${SERVICE_NAME} не активен:"
        echo "$listeners"
        log "Остановите старый процесс на сервере вручную и повторите деплой."
        exit 1
      fi
    fi
  fi
}

ensure_postgres() {
  if ! command -v psql >/dev/null 2>&1; then
    log "Установка PostgreSQL"
    apt-get update -y
    apt-get install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
  fi

  local db_url db_user db_pass db_host db_name
  db_url=$(grep -E '^DATABASE_URL=' "$APP_DIR/.env" | head -n1 | sed -E 's/^DATABASE_URL=//; s/^"//; s/"$//')

  if [ -z "$db_url" ]; then
    log "DATABASE_URL не найден в .env - пропускаю автосоздание БД"
    return
  fi

  local no_scheme userinfo_host path_query userinfo hostport
  no_scheme="${db_url#*://}"
  userinfo_host="${no_scheme%%/*}"
  path_query="${no_scheme#*/}"
  db_name="${path_query%%\?*}"
  userinfo="${userinfo_host%%@*}"
  hostport="${userinfo_host#*@}"
  db_user="${userinfo%%:*}"
  db_pass="${userinfo#*:}"
  db_host="${hostport%%:*}"

  if [ "$db_host" != "localhost" ] && [ "$db_host" != "127.0.0.1" ]; then
    log "DATABASE_URL указывает на внешний хост ($db_host) - пропускаю автосоздание БД"
    return
  fi

  log "Проверка роли и базы данных '${db_name}' в локальном PostgreSQL"
  sudo -u postgres psql -v ON_ERROR_STOP=1 >/dev/null <<SQL
DO
\$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${db_user}') THEN
      CREATE ROLE ${db_user} LOGIN PASSWORD '${db_pass}';
   ELSE
      ALTER ROLE ${db_user} WITH PASSWORD '${db_pass}';
   END IF;
END
\$\$;
SQL

  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${db_name}'" | grep -q 1; then
    log "Создание базы данных '${db_name}'"
    sudo -u postgres createdb -O "${db_user}" "${db_name}"
  fi
}

ensure_mtu_workaround() {
  # У некоторых VDS-провайдеров реальный MTU по пути в интернет меньше, чем
  # заявлен на сетевом интерфейсе, а ICMP "нужна фрагментация" фильтруется -
  # из-за этого крупные "цельные" ответы nginx теряются ("MTU black hole"),
  # хотя мелкие запросы/TCP-хендшейк проходят нормально. Обходим это,
  # принудительно подрезая MSS в исходящих SYN/SYN-ACK пакетах.
  if ! command -v iptables >/dev/null 2>&1; then
    return
  fi

  if ! iptables -t mangle -C OUTPUT -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null; then
    log "Добавление правила TCPMSS clamp (обход проблемы MTU у провайдера)"
    iptables -t mangle -A OUTPUT -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu
  fi

  if ! command -v netfilter-persistent >/dev/null 2>&1; then
    log "Установка iptables-persistent, чтобы правило сохранялось после перезагрузки"
    echo iptables-persistent iptables-persistent/autosave_v4 boolean true | debconf-set-selections
    echo iptables-persistent iptables-persistent/autosave_v6 boolean true | debconf-set-selections
    DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent
  fi
  netfilter-persistent save >/dev/null 2>&1 || true
}

ensure_nginx() {
  if ! command -v nginx >/dev/null 2>&1; then
    log "Установка nginx"
    apt-get update -y
    apt-get install -y nginx
  fi

  mkdir -p "$CERTBOT_WEBROOT"

  local desired_conf="$APP_DIR/deploy/domstroy.nginx.conf"
  if [ -f "/etc/letsencrypt/live/${DOMAIN_PRIMARY}/fullchain.pem" ]; then
    desired_conf="$APP_DIR/deploy/domstroy.nginx-ssl.conf"
  fi

  local site_path="/etc/nginx/sites-available/${SERVICE_NAME}"
  if [ ! -f "$site_path" ] || ! cmp -s "$desired_conf" "$site_path"; then
    log "Установка/обновление конфигурации nginx для ${SERVICE_NAME} ($(basename "$desired_conf"))"
    cp "$desired_conf" "$site_path"
    ln -sf "$site_path" "/etc/nginx/sites-enabled/${SERVICE_NAME}"
  fi

  if [ -f /etc/nginx/sites-enabled/default ]; then
    log "Отключение дефолтной заглушки nginx (конфликтует с портом 80)"
    rm -f /etc/nginx/sites-enabled/default
  fi

  if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
    log "Открытие портов 80/tcp и 443/tcp в ufw"
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
  fi

  log "Проверка конфигурации nginx"
  nginx -t

  systemctl enable nginx >/dev/null 2>&1 || true
  if systemctl is-active --quiet nginx; then
    systemctl reload nginx
  else
    systemctl restart nginx
  fi
}

ensure_ssl() {
  if [ -f "/etc/letsencrypt/live/${DOMAIN_PRIMARY}/fullchain.pem" ]; then
    log "SSL-сертификат для ${DOMAIN_PRIMARY} уже есть"
    return
  fi

  if ! command -v certbot >/dev/null 2>&1; then
    log "Установка certbot"
    apt-get update -y
    apt-get install -y certbot
  fi

  log "Запрос SSL-сертификата Let's Encrypt для ${DOMAIN_PRIMARY} и ${DOMAIN_WWW}"
  if certbot certonly --webroot -w "$CERTBOT_WEBROOT" \
      -d "$DOMAIN_PRIMARY" -d "$DOMAIN_WWW" \
      --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --no-eff-email; then
    log "Сертификат получен, включаю HTTPS-конфиг nginx"

    mkdir -p /etc/letsencrypt/renewal-hooks/deploy
    cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'HOOK'
#!/bin/sh
systemctl reload nginx
HOOK
    chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
    systemctl enable --now certbot.timer >/dev/null 2>&1 || true

    ensure_nginx
  else
    log "ПРЕДУПРЕЖДЕНИЕ: не удалось получить SSL-сертификат (возможно, DNS для домена ещё не обновился везде). Сайт продолжит работать по HTTP, попробуем снова при следующем деплое."
  fi
}

build_application() {
  cd "$APP_DIR"
  log "Установка npm-зависимостей (npm ci)"
  npm ci

  log "Генерация Prisma Client"
  npx prisma generate

  log "Применение миграций базы данных (prisma migrate deploy)"
  npx prisma migrate deploy

  log "Сборка Next.js приложения"
  npm run build
}

ensure_admin_user() {
  if ! grep -qE '^ADMIN_EMAIL=' "$APP_DIR/.env"; then
    log "ADMIN_EMAIL не задан в .env - пропускаю создание админа"
    return
  fi
  log "Проверка/создание учётной записи администратора"
  node --env-file="$APP_DIR/.env" "$APP_DIR/skripts/create-demo-admin.js"
}

install_service() {
  if [ ! -f "$UNIT_PATH" ] || ! cmp -s "$APP_DIR/deploy/domstroy.service" "$UNIT_PATH"; then
    log "Установка/обновление systemd-юнита $SERVICE_NAME"
    cp "$APP_DIR/deploy/domstroy.service" "$UNIT_PATH"
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
  fi
}

restart_service() {
  log "Перезапуск systemd-сервиса $SERVICE_NAME"
  systemctl restart "$SERVICE_NAME"
}

verify_service() {
  log "Проверка состояния сервиса"
  sleep 3
  if ! systemctl is-active --quiet "$SERVICE_NAME"; then
    log "ОШИБКА: сервис $SERVICE_NAME не активен после деплоя. Последние логи:"
    journalctl -u "$SERVICE_NAME" -n 50 --no-pager || true
    exit 1
  fi
  log "Сервис $SERVICE_NAME активен (статус: $(systemctl is-active "$SERVICE_NAME"))"
}

require_root
ensure_directory
ensure_env_file
ensure_dependencies
check_port_conflict
ensure_postgres
ensure_mtu_workaround
ensure_nginx
ensure_ssl
build_application
ensure_admin_user
install_service
restart_service
verify_service

log "Деплой завершён успешно"
