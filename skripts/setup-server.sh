#!/usr/bin/env bash
set -euo pipefail

# === Configurable defaults ===
DB_NAME=${DB_NAME:-buildmarket}
DB_USER=${DB_USER:-buildmarket}
DB_PASSWORD=${DB_PASSWORD:-buildmarket_secret}
APP_DIR=${APP_DIR:-/opt/domstroy}
NODE_MAJOR=${NODE_MAJOR:-20}

log() {
  echo "[setup] $1"
}

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root" >&2
    exit 1
  fi
}

install_base_packages() {
  log "Updating apt cache"
  apt-get update -y
  log "Installing base packages"
  apt-get install -y ca-certificates curl gnupg lsb-release git build-essential unzip ufw
}

install_node() {
  if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q "v${NODE_MAJOR}"; then
    log "Installing Node.js ${NODE_MAJOR}.x"
    curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
    apt-get install -y nodejs
  else
    log "Node.js already installed"
  fi
}

install_postgres() {
  if ! command -v psql >/dev/null 2>&1; then
    log "Installing PostgreSQL"
    apt-get install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
  else
    log "PostgreSQL already installed"
  fi

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

prepare_app_directory() {
  if [ ! -d "$APP_DIR" ]; then
    log "Creating application directory $APP_DIR"
    mkdir -p "$APP_DIR"
  fi
  chown root:root "$APP_DIR"
  chmod 755 "$APP_DIR"
}

configure_firewall() {
  if command -v ufw >/dev/null 2>&1; then
    log "Configuring UFW firewall"
    ufw allow OpenSSH || true
    ufw allow 4000/tcp || true
    ufw --force enable || true
  fi
}

print_summary() {
  cat <<INFO
============================================
Server bootstrap complete.
Database: ${DB_NAME}
DB user: ${DB_USER}
DB password: ${DB_PASSWORD}
App dir: ${APP_DIR}
Node.js: $(node -v)
============================================
INFO
}

require_root
install_base_packages
install_node
install_postgres
prepare_app_directory
configure_firewall
print_summary
