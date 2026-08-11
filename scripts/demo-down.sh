#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

if [ ! -f .env.demo ]; then
  echo "Nenhuma demonstracao configurada."
  exit 0
fi

docker compose --env-file .env.demo -f compose.demo.yml --profile tunnel down
echo "Demonstracao encerrada. Os dados foram preservados nos volumes Docker."
