#!/usr/bin/env bash
set -euo pipefail

DB_NAME=${DB_NAME:-buildmarket}
DB_USER=${DB_USER:-buildmarket}
DB_PASSWORD=${DB_PASSWORD:-buildmarket_demo}
APP_DIR=${APP_DIR:-/opt/myapp}
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@buildmarket.demo}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-Admin123!}
ADMIN_NAME=${ADMIN_NAME:-"Demo Admin"}
NODE_MAJOR=${NODE_MAJOR:-20}

log() {
  echo "[demo-setup] $1"
}

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root" >&2
    exit 1
  fi
}

install_postgres() {
  if ! command -v psql >/dev/null 2>&1; then
    log "Installing PostgreSQL"
    apt-get update -y
    apt-get install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
  else
    log "PostgreSQL already installed"
  fi
}

configure_database() {
  log "Configuring database ${DB_NAME}"
  sudo -u postgres psql <<SQL
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
   END IF;
END
$$;

CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
SQL
}

install_node() {
  if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q "v${NODE_MAJOR}"; then
    log "Installing Node.js ${NODE_MAJOR}.x"
    curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
    apt-get install -y nodejs
  fi
}

run_migrations() {
  if [ ! -d "$APP_DIR" ]; then
    echo "Application directory $APP_DIR not found" >&2
    exit 1
  fi
  cd "$APP_DIR"
  log "Running npm ci"
  npm ci
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"
  log "Applying Prisma migrations"
  npx prisma migrate deploy
}

create_admin() {
  cd "$APP_DIR"
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"
  ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" ADMIN_NAME="$ADMIN_NAME" \
    node skripts/create-demo-admin.js
}

require_root
install_postgres
configure_database
install_node
run_migrations
create_admin

log "Demo setup complete. Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}"
