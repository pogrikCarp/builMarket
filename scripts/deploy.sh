#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/myapp"
SERVICE_NAME="buildmarket"
NODE_MAJOR="20"

log() {
  echo "[deploy] $1"
}

ensure_directory() {
  if [ ! -d "$APP_DIR" ]; then
    log "Creating $APP_DIR"
    mkdir -p "$APP_DIR"
    chown root:root "$APP_DIR"
    chmod 755 "$APP_DIR"
  fi
}

ensure_dependencies() {
  log "Updating apt repositories and base packages"
  apt-get update -y
  apt-get install -y ca-certificates curl git build-essential

  if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q "v$NODE_MAJOR"; then
    log "Installing Node.js $NODE_MAJOR.x"
    curl -fsSL https://deb.nodesource.com/setup_$NODE_MAJOR.x | bash -
    apt-get install -y nodejs
  fi
}

build_application() {
  cd "$APP_DIR"
  log "Installing npm dependencies"
  npm ci

  log "Applying Prisma migrations"
  npx prisma migrate deploy

  log "Building Next.js application"
  npm run build
}

install_service() {
  local unit_path="/etc/systemd/system/${SERVICE_NAME}.service"
  if [ ! -f "$unit_path" ] || ! cmp -s "$APP_DIR/deploy/buildmarket.service" "$unit_path"; then
    log "Installing systemd unit"
    cp "$APP_DIR/deploy/buildmarket.service" "$unit_path"
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
  fi
}

restart_service() {
  log "Restarting systemd service"
  systemctl restart "$SERVICE_NAME"
}

ensure_directory
ensure_dependencies
build_application
install_service
restart_service

log "Deployment completed successfully"
