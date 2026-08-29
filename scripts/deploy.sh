#!/usr/bin/env bash
# Идемпотентный blue-green деплой-скрипт buildmarket/domstroy.
#
# Каждый релиз собирается в СВОЙ отдельный каталог releases/<id> и запускается
# СВОИМ systemd-юнитом на "неактивном" порту (4000/4001 по очереди), пока
# старая версия продолжает обслуживать реальный трафик. Только после того как
# новая версия ответила на /api/health, nginx атомарно переключается на неё
# (перезапись upstream-порта + reload, без разрыва соединений), и лишь ПОСЛЕ
# этого останавливается старая версия. Если новая версия не поднялась - скрипт
# завершается с ошибкой, а сайт как ни в чём не бывало продолжает работать на
# старой версии.
#
# Также ставит/настраивает nginx (реверс-прокси) и PostgreSQL - другие
# процессы/сервисы на сервере не затрагивает.
set -euo pipefail

APP_DIR="/opt/domstroy"
SERVICE_PREFIX="domstroy"
PORT_BLUE="4000"
PORT_GREEN="4001"
NODE_MAJOR="20"
UPSTREAM_CONF="/etc/nginx/conf.d/domstroy-upstream.conf"
DOMAIN_PRIMARY="marketdomstroy.ru"
DOMAIN_WWW="www.marketdomstroy.ru"
CERTBOT_EMAIL="domstroy.dmd@mail.ru"
CERTBOT_WEBROOT="/var/www/certbot"

RELEASE_ID="${1:?Использование: deploy.sh <release_id> (каталог releases/<release_id> должен уже быть синхронизирован rsync-ом)}"
RELEASE_DIR="$APP_DIR/releases/$RELEASE_ID"

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
  mkdir -p "$APP_DIR" "$APP_DIR/releases" "$APP_DIR/shared/uploads"
  chown root:root "$APP_DIR"
  chmod 755 "$APP_DIR"

  if [ ! -d "$RELEASE_DIR" ]; then
    log "ОШИБКА: каталог релиза $RELEASE_DIR не найден - rsync должен был создать его перед запуском деплой-скрипта"
    exit 1
  fi
}

# Одноразовая миграция: до перехода на blue-green схему загруженные через
# админку файлы лежали прямо в $APP_DIR/public/uploads (в единственном
# рабочем каталоге приложения). Переносим их в общий $APP_DIR/shared/uploads,
# иначе после первого переключения на релизы они станут недоступны (404).
migrate_legacy_uploads() {
  local legacy_dir="$APP_DIR/public/uploads"
  if [ -d "$legacy_dir" ] && [ -z "$(ls -A "$APP_DIR/shared/uploads" 2>/dev/null)" ]; then
    log "Перенос ранее загруженных файлов из $legacy_dir в общий каталог $APP_DIR/shared/uploads"
    cp -a "$legacy_dir/." "$APP_DIR/shared/uploads/" 2>/dev/null || true
  fi
}

ensure_env_file() {
  if [ ! -f "$APP_DIR/.env" ]; then
    log "ОШИБКА: файл $APP_DIR/.env не найден. Он создаётся вручную и не входит в автодеплой."
    exit 1
  fi
}

# public/uploads (файлы, загруженные через админку) должны переживать смену
# релизов - поэтому это не часть релиза, а общий каталог, на который каждый
# новый релиз получает symlink.
link_shared_uploads() {
  rm -rf "$RELEASE_DIR/public/uploads"
  ln -sfn "$APP_DIR/shared/uploads" "$RELEASE_DIR/public/uploads"
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

# Порт, на который nginx сейчас проксирует реальный трафик (см. write_upstream_conf).
# Если файла ещё нет (самый первый деплой по новой blue-green схеме) - считаем,
# что активен "синий" порт 4000, как это было при старой (одноюнитовой) схеме.
get_active_port() {
  if [ -f "$UPSTREAM_CONF" ]; then
    grep -oE '127\.0\.0\.1:[0-9]+' "$UPSTREAM_CONF" | head -n1 | cut -d: -f2
  else
    echo "$PORT_BLUE"
  fi
}

other_port() {
  if [ "$1" = "$PORT_BLUE" ]; then echo "$PORT_GREEN"; else echo "$PORT_BLUE"; fi
}

write_upstream_conf() {
  local port="$1"
  mkdir -p "$(dirname "$UPSTREAM_CONF")"
  cat > "$UPSTREAM_CONF" <<CONF
# Автогенерируется scripts/deploy.sh - ручные правки будут перезаписаны при
# следующем деплое. Определяет, какой из двух портов (blue=$PORT_BLUE /
# green=$PORT_GREEN) сейчас обслуживает реальный трафик.
upstream domstroy_upstream {
    server 127.0.0.1:${port};
}
CONF
}

ensure_nginx() {
  if ! command -v nginx >/dev/null 2>&1; then
    log "Установка nginx"
    apt-get update -y
    apt-get install -y nginx
  fi

  mkdir -p "$CERTBOT_WEBROOT"

  # upstream-конфиг должен существовать ДО применения серверных блоков, иначе
  # `nginx -t` упадёт с "unknown upstream" при первом переходе на новую
  # (blue-green) схему.
  if [ ! -f "$UPSTREAM_CONF" ]; then
    write_upstream_conf "$(get_active_port)"
  fi

  local desired_conf="$RELEASE_DIR/deploy/domstroy.nginx.conf"
  if [ -f "/etc/letsencrypt/live/${DOMAIN_PRIMARY}/fullchain.pem" ]; then
    desired_conf="$RELEASE_DIR/deploy/domstroy.nginx-ssl.conf"
  fi

  local site_path="/etc/nginx/sites-available/${SERVICE_PREFIX}"
  if [ ! -f "$site_path" ] || ! cmp -s "$desired_conf" "$site_path"; then
    log "Установка/обновление конфигурации nginx для ${SERVICE_PREFIX} ($(basename "$desired_conf"))"
    cp "$desired_conf" "$site_path"
    ln -sf "$site_path" "/etc/nginx/sites-enabled/${SERVICE_PREFIX}"
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

build_release() {
  cd "$RELEASE_DIR"
  link_shared_uploads

  log "Установка npm-зависимостей (npm ci) в $RELEASE_DIR"
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
  node --env-file="$APP_DIR/.env" "$RELEASE_DIR/skripts/create-demo-admin.js"
}

# Освобождает целевой порт перед запуском новой версии: если он занят НАШИМ
# предыдущим (неактивным) релизом - останавливаем его, если посторонним
# процессом - прерываем деплой без вмешательства в чужие процессы.
ensure_target_port_free() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    local listeners
    listeners=$(ss -ltnp "sport = :${port}" 2>/dev/null | tail -n +2 || true)
    if [ -n "$listeners" ]; then
      if systemctl is-active --quiet "${SERVICE_PREFIX}-${port}" 2>/dev/null; then
        log "Порт ${port} занят предыдущим (неактивным) релизом ${SERVICE_PREFIX}-${port} - останавливаю перед новым деплоем"
        systemctl stop "${SERVICE_PREFIX}-${port}"
      else
        log "ОШИБКА: порт ${port} занят посторонним процессом, деплой на этот порт невозможен:"
        echo "$listeners"
        exit 1
      fi
    fi
  fi
}

install_and_start_service() {
  local port="$1"
  local unit_name="${SERVICE_PREFIX}-${port}"
  local unit_path="/etc/systemd/system/${unit_name}.service"

  log "Установка systemd-юнита ${unit_name} (релиз $RELEASE_ID, порт ${port})"
  sed \
    -e "s#__RELEASE_DIR__#${RELEASE_DIR}#g" \
    -e "s#__PORT__#${port}#g" \
    "$RELEASE_DIR/deploy/domstroy.service" > "$unit_path"

  systemctl daemon-reload
  systemctl enable "$unit_name" >/dev/null 2>&1 || true
  systemctl restart "$unit_name"
}

# Ждём, пока новая версия сама подтвердит готовность через /api/health -
# только тогда безопасно переключать на неё реальный трафик.
wait_for_health() {
  local port="$1"
  local attempts=40
  local i
  for ((i = 1; i <= attempts; i++)); do
    if curl -fsS -m 2 "http://127.0.0.1:${port}/api/health" >/dev/null 2>&1; then
      log "Новая версия на порту ${port} ответила на /api/health (попытка ${i}/${attempts})"
      return 0
    fi
    sleep 1
  done
  return 1
}

switch_traffic_to() {
  local port="$1"
  log "Переключение nginx на порт ${port}"
  write_upstream_conf "$port"
  nginx -t
  systemctl reload nginx
}

# Останавливает версию на старом порту. Отдельно подчищает legacy-юнит
# "domstroy" (без порта в имени) - он остался от прежней (не blue-green) схемы
# деплоя и мог всё ещё обслуживать порт 4000 на момент первого перехода на эту
# схему.
stop_old_service() {
  local port="$1"
  local unit_name="${SERVICE_PREFIX}-${port}"

  if systemctl list-unit-files --no-legend "${unit_name}.service" 2>/dev/null | grep -q .; then
    log "Останавливаю старую версию (${unit_name}, порт ${port})"
    systemctl stop "$unit_name" || true
  fi

  if [ "$port" = "$PORT_BLUE" ] && systemctl is-active --quiet "$SERVICE_PREFIX" 2>/dev/null; then
    log "Останавливаю устаревший юнит ${SERVICE_PREFIX}.service (миграция на blue-green схему деплоя)"
    systemctl stop "$SERVICE_PREFIX" || true
    systemctl disable "$SERVICE_PREFIX" >/dev/null 2>&1 || true
  fi
}

cleanup_old_releases() {
  local releases_dir="$APP_DIR/releases"
  [ -d "$releases_dir" ] || return
  # Храним только 3 последних релиза - остальные удаляем, чтобы node_modules
  # и .next разных релизов не съедали весь диск на сервере.
  local old
  ls -1dt "$releases_dir"/*/ 2>/dev/null | tail -n +4 | while IFS= read -r old; do
    log "Удаление старого релиза $(basename "$old")"
    rm -rf "$old"
  done
}

deploy_release() {
  local active_port new_port
  active_port="$(get_active_port)"
  new_port="$(other_port "$active_port")"

  log "Текущая активная версия: порт ${active_port}. Разворачиваю новый релиз ${RELEASE_ID} на порт ${new_port}."

  ensure_target_port_free "$new_port"
  build_release
  install_and_start_service "$new_port"

  if ! wait_for_health "$new_port"; then
    log "ОШИБКА: новая версия на порту ${new_port} не ответила на /api/health - откатываю деплой, старая версия (порт ${active_port}) продолжает работать без изменений"
    systemctl stop "${SERVICE_PREFIX}-${new_port}" || true
    log "Последние логи новой версии:"
    journalctl -u "${SERVICE_PREFIX}-${new_port}" -n 80 --no-pager || true
    exit 1
  fi

  switch_traffic_to "$new_port"
  sleep 2
  stop_old_service "$active_port"
  cleanup_old_releases

  log "Трафик переключён на порт ${new_port} (релиз ${RELEASE_ID})"
}

require_root
ensure_directory
migrate_legacy_uploads
ensure_env_file
ensure_dependencies
ensure_postgres
ensure_mtu_workaround
ensure_nginx
ensure_ssl
deploy_release
ensure_admin_user

log "Деплой завершён успешно"
