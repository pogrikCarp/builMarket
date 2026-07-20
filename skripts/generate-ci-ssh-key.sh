#!/usr/bin/env bash
set -euo pipefail

KEY_NAME=${KEY_NAME:-domstroy_ci}
KEY_DIR=${KEY_DIR:-$HOME/.ssh}
KEY_PATH="${KEY_DIR}/${KEY_NAME}"
COMMENT=${COMMENT:-"domstroy-ci"}

log() {
  echo "[ssh-keygen] $1"
}

ensure_directory() {
  if [ ! -d "$KEY_DIR" ]; then
    log "Creating directory $KEY_DIR"
    mkdir -p "$KEY_DIR"
    chmod 700 "$KEY_DIR"
  fi
}

generate_key() {
  if [ -f "$KEY_PATH" ]; then
    log "Key $KEY_PATH already exists. Aborting to avoid overwrite."
    exit 1
  fi

  log "Generating ed25519 key pair at $KEY_PATH"
  ssh-keygen -t ed25519 -C "$COMMENT" -f "$KEY_PATH" -N ""
}

print_instructions() {
  cat <<INFO
============================================
SSH key generated.
Private key : $KEY_PATH
Public key  : ${KEY_PATH}.pub

Next steps:
1. Copy the *private* key content (cat $KEY_PATH) into GitHub repo secret named SSH_KEY.
2. Append the *public* key content (cat ${KEY_PATH}.pub) to /root/.ssh/authorized_keys on the server.
3. Confirm secrets SSH_HOST, SSH_PORT, SSH_USER=root are also set in the repo.
============================================
INFO
}

ensure_directory
generate_key
print_instructions
