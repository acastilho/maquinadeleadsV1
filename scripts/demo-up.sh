#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="$ROOT_DIR/.env.demo"
COMPOSE_FILE="$ROOT_DIR/compose.demo.yml"

command -v docker >/dev/null 2>&1 || {
  echo "Erro: Docker nao encontrado."
  exit 1
}

docker compose version >/dev/null 2>&1 || {
  echo "Erro: o plugin Docker Compose nao foi encontrado."
  exit 1
}

if [ ! -f "$ENV_FILE" ]; then
  "$ROOT_DIR/scripts/demo-init.sh"
fi

if grep -q 'CHANGE_ME_' "$ENV_FILE"; then
  echo "Erro: .env.demo ainda contem valores CHANGE_ME_."
  exit 1
fi

DEMO_PORT=$(sed -n 's/^DEMO_PORT=//p' "$ENV_FILE" | tail -n 1)
DEMO_PORT=${DEMO_PORT:-8088}

cd "$ROOT_DIR"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --profile tunnel up -d --build --remove-orphans

echo "Aguardando a API ficar pronta..."
READY=0
for _ in $(seq 1 36); do
  if curl -fsS "http://127.0.0.1:${DEMO_PORT}/health" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 5
done

if [ "$READY" -ne 1 ]; then
  echo "Erro: a aplicacao nao ficou saudavel. Veja os logs com:"
  echo "docker compose --env-file .env.demo -f compose.demo.yml logs --tail=120"
  exit 1
fi

echo "Aguardando a URL publica temporaria..."
PUBLIC_URL=""
for _ in $(seq 1 24); do
  PUBLIC_URL=$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs tunnel 2>/dev/null \
    | grep -Eo 'https://[-a-z0-9]+\.trycloudflare\.com' \
    | tail -n 1 || true)
  [ -n "$PUBLIC_URL" ] && break
  sleep 2
done

echo
echo "Demonstracao pronta."
echo "Local:  http://127.0.0.1:${DEMO_PORT}"
echo "n8n:    http://127.0.0.1:5678"
if [ -n "$PUBLIC_URL" ]; then
  echo "Publica: $PUBLIC_URL"
else
  echo "O tunel iniciou, mas a URL ainda nao apareceu. Rode ./scripts/demo-status.sh"
fi
