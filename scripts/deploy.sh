#!/usr/bin/env bash
# Идемпотентный деплой-скрипт buildmarket/domstroy.
# Безопасен для повторного запуска, не трогает другие процессы/сервисы на сервере
# (кроме управления собственным systemd-юнитом ${SERVICE_NAME}).
set -euo pipefail

APP_DIR="/opt/domstroy"
SERVICE_NAME="domstroy"
APP_PORT="4000"
NODE_MAJOR="20"
UNIT_PATH="/etc/systemd/system/${SERVICE_NAME}.service"

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
build_application
install_service
restart_service
verify_service

log "Деплой завершён успешно"
