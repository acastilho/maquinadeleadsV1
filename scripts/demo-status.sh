#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

if [ ! -f .env.demo ]; then
  echo "Execute ./scripts/demo-init.sh primeiro."
  exit 1
fi

docker compose --env-file .env.demo -f compose.demo.yml --profile tunnel ps
PUBLIC_URL=$(docker compose --env-file .env.demo -f compose.demo.yml logs tunnel 2>/dev/null \
  | grep -Eo 'https://[-a-z0-9]+\.trycloudflare\.com' \
  | tail -n 1 || true)

if [ -n "$PUBLIC_URL" ]; then
  echo "URL publica: $PUBLIC_URL"
else
  echo "URL publica ainda indisponivel. Confira: docker compose --env-file .env.demo -f compose.demo.yml logs tunnel"
fi
