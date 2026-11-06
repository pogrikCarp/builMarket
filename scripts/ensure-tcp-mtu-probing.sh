#!/usr/bin/env bash
# Resilience against TCP path-MTU black holes; not proof of a VPN root cause.
# No TLS, firewall or service changes. Maintenance mode verifies local HTTPS.
set -euo pipefail
umask 077
key="net.ipv4.tcp_mtu_probing"
config="/etc/sysctl.d/90-domstroy-tcp-mtu.conf"
marker="# Managed by DomStroy: TCP MTU probing"
backup_root="/opt/domstroy/shared/network-config-backups"
check_health=0; changed=0; had_config=0; temporary=""; restore_temp=""
die() { printf '[network] %s\n' "$1" >&2; exit 1; }
health() {
  local status
  status="$(curl --noproxy '*' --silent --show-error --output /dev/null \
    --connect-timeout 5 --max-time 20 --write-out '%{http_code}' \
    --resolve marketdomstroy.ru:443:127.0.0.1 \
    https://marketdomstroy.ru/api/health)" || return 1
  [ "$status" = "200" ]
}
rollback() {
  local failed=0
  printf '[network] Restoring previous config and runtime value.\n' >&2
  if [ "$had_config" = 1 ]; then
    restore_temp="$(mktemp "${config}.rollback.XXXXXX")"
    if [ -n "$restore_temp" ] && cp -p -- "$backup_dir/previous.conf" "$restore_temp"; then
      mv -f -- "$restore_temp" "$config" || failed=1
      cmp -s "$config" "$backup_dir/previous.conf" || failed=1
    else
      failed=1
    fi
  elif [ -f "$config" ] && [ ! -L "$config" ] && \
    cmp -s "$config" <(printf '%s\n' "$managed_content"); then
    rm -f -- "$config" || failed=1
  elif [ -e "$config" ] || [ -L "$config" ]; then
    printf '[network] Config changed externally; refusing to remove it.\n' >&2
    failed=1
  fi
  sysctl -w "$key=$previous" >/dev/null || failed=1
  [ "$(sysctl -n "$key")" = "$previous" ] || failed=1
  if [ "$failed" = 0 ]; then
    printf '[network] Rollback verified. Backup: %s\n' "$backup_dir" >&2
  else
    printf '[network] Rollback incomplete; inspect backup: %s\n' "$backup_dir" >&2
  fi
}
finish() {
  local result=$?
  trap - EXIT HUP INT TERM
  set +e
  if [ "$result" -ne 0 ] && [ "$changed" = 1 ]; then rollback; fi
  if [ -n "$temporary" ]; then rm -f -- "$temporary"; fi
  if [ -n "$restore_temp" ]; then rm -f -- "$restore_temp"; fi
  exit "$result"
}
trap finish EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

[ "$EUID" = 0 ] || die "Run as root."
if [ "$#" = 1 ] && [ "$1" = "--check-health" ]; then
  check_health=1
elif [ "$#" -ne 0 ]; then
  die "Usage: ensure-tcp-mtu-probing.sh [--check-health]"
fi
command -v sysctl >/dev/null || die "sysctl is required."
[ -d /etc/sysctl.d ] || die "/etc/sysctl.d is unavailable."
if [ -L "$config" ] || { [ -e "$config" ] && [ ! -f "$config" ]; }; then
  die "Managed config must be a regular file, never a symlink."
fi
if [ -e "$config" ]; then
  grep -Fxq -- "$marker" "$config" || die "Refusing to overwrite an unrecognized config."
  had_config=1
fi
previous="$(sysctl -n "$key")"
case "$previous" in 0|1) target=1 ;; 2) target=2 ;; *) die "Unexpected TCP MTU probing value." ;; esac
managed_content="$(printf '%s\n%s = %s\n' "$marker" "$key" "$target")"
if [ "$check_health" = 1 ]; then
  command -v curl >/dev/null || die "curl is required for health checks."
  health || die "HTTPS health failed before changes; no settings changed."
fi
if [ "$previous" = "$target" ] && [ -f "$config" ] && \
  cmp -s "$config" <(printf '%s\n' "$managed_content"); then
  printf '[network] %s=%s already active and persisted.\n' "$key" "$target"
  exit 0
fi

mkdir -p -- "$backup_root"
backup_dir="$(mktemp -d "$backup_root/$(date -u +%Y%m%dT%H%M%SZ).XXXXXX")"
printf '%s\n' "$previous" > "$backup_dir/runtime.before"
if [ "$had_config" = 1 ]; then
  cp -p -- "$config" "$backup_dir/previous.conf"
else
  printf 'Previous managed config was absent.\n' > "$backup_dir/config.absent"
fi
temporary="$(mktemp "${config}.new.XXXXXX")"
printf '%s\n' "$managed_content" > "$temporary"
chmod 644 "$temporary"
changed=1
mv -f -- "$temporary" "$config"
temporary=""
sysctl -w "$key=$target" >/dev/null
[ "$(sysctl -n "$key")" = "$target" ] || die "Runtime verification failed."
cmp -s "$config" <(printf '%s\n' "$managed_content") || die "Persistent config verification failed."
if [ "$check_health" = 1 ]; then health || die "HTTPS health failed after changes."; fi
printf '[network] %s=%s active and persisted. Backup: %s\n' "$key" "$target" "$backup_dir"
