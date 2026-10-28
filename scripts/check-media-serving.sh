#!/usr/bin/env bash
# Verify a file created AFTER Next.js startup through both Next.js and nginx.
set -euo pipefail

release_id="${1:?Usage: check-media-serving.sh <release_id>}"
if [[ ! "$release_id" =~ ^[a-zA-Z0-9-]+$ ]]; then
  echo "Invalid release id" >&2
  exit 1
fi

app_dir="/opt/domstroy"
original="$app_dir/releases/$release_id/public/banner4.png"
filename="deploy-check-$release_id-$$.png"
uploaded="$app_dir/shared/uploads/$filename"
response="$(mktemp)"
trap 'rm -f -- "$uploaded" "$response"' EXIT

port="$(grep -oE '127\.0\.0\.1:[0-9]+' /etc/nginx/conf.d/domstroy-upstream.conf | head -n1 | cut -d: -f2)"
cp -- "$original" "$uploaded"

for base in "http://127.0.0.1:$port" "https://marketdomstroy.ru"; do
  curl -fsS --max-time 30 "$base/uploads/$filename" -o "$response"
  cmp -- "$original" "$response"
  echo "[media-check] Runtime upload served correctly: $base"
done
