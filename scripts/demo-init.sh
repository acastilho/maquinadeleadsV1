#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="$ROOT_DIR/.env.demo"
EXAMPLE_FILE="$ROOT_DIR/.env.demo.example"

if [ -f "$ENV_FILE" ]; then
  echo "Configuracao ja existe em .env.demo; nenhum arquivo foi alterado."
  exit 0
fi

command -v openssl >/dev/null 2>&1 || {
  echo "Erro: instale openssl para gerar os segredos da demonstracao."
  exit 1
}

cp "$EXAMPLE_FILE" "$ENV_FILE"
POSTGRES_SECRET=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 48)
SEARXNG_SECRET=$(openssl rand -hex 32)

sed -i "s/CHANGE_ME_POSTGRES/$POSTGRES_SECRET/" "$ENV_FILE"
sed -i "s/CHANGE_ME_JWT/$JWT_SECRET/" "$ENV_FILE"
sed -i "s/CHANGE_ME_SEARXNG/$SEARXNG_SECRET/" "$ENV_FILE"
chmod 600 "$ENV_FILE"

echo "Configuracao criada em .env.demo."
echo "A chave N8N_API_KEY pode ser adicionada depois do primeiro inicio."
