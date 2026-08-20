# Ambiente gratuito de demonstracao e CI/CD

Este pacote publica a aplicacao completa somente enquanto o computador estiver
ligado. O frontend, a API, PostgreSQL, n8n e SearXNG rodam em Docker. Um Quick
Tunnel da Cloudflare fornece uma URL HTTPS temporaria sem abrir portas no
roteador.

## O que fica automatizado

- GitHub Actions valida frontend, backend, Compose e imagens Docker a cada
  `push` ou pull request para `main`.
- Depois de um `push` aprovado, o Actions gera um pacote validado do commit e o
  mantem como artefato por sete dias.
- `demo-up.sh` constroi e inicia a versao atual, aplica as migrations, espera os
  servicos ficarem saudaveis e mostra a URL publica.
- `demo-down.sh` encerra a exposicao e os containers sem apagar os dados.

Como o computador fica desligado fora das demonstracoes, o deploy e iniciado
manualmente. Isso e entrega continua sob demanda; nao ha como um servico externo
implantar em uma maquina desligada.

## Primeiro uso

Requisitos: Docker Engine com o plugin Compose e `openssl`.

```bash
chmod +x scripts/*.sh
./scripts/demo-init.sh
./scripts/demo-up.sh
```

O terminal mostrara tres enderecos:

- aplicacao local: `http://127.0.0.1:8088`
- n8n local: `http://127.0.0.1:5678`
- demonstracao publica: `https://...trycloudflare.com`

Somente o frontend/proxy e publicado. PostgreSQL, API, n8n e SearXNG nao
recebem portas publicas da internet.

## Configuracao inicial do n8n

No primeiro inicio, abra `http://127.0.0.1:5678`, crie o usuario proprietario e
gere uma API key no n8n. Depois edite `.env.demo`:

```dotenv
N8N_API_KEY=cole_a_chave_aqui
```

Reexecute `./scripts/demo-up.sh`. O arquivo `.env.demo` esta ignorado pelo Git e
nao deve ser enviado ao repositorio.

## Rotina de demonstracao

Antes de apresentar:

```bash
git pull --ff-only
./scripts/demo-up.sh
```

Para consultar a URL e o estado:

```bash
./scripts/demo-status.sh
```

Ao terminar:

```bash
./scripts/demo-down.sh
```

A URL publica muda a cada novo tunel. Compartilhe somente a URL exibida no
inicio da demonstracao.

## Ativar o CI no GitHub

Inclua a pasta `.github/workflows` no proximo commit e envie para `main`. A aba
Actions do repositorio mostrara o workflow `CI`. Nenhum segredo e necessario
para esse workflow.

## Limites deste ambiente

- Destinado a demonstracoes e testes, nao a producao permanente.
- O Quick Tunnel aceita ate 200 requisicoes simultaneas e nao suporta SSE.
- Se o computador dormir, perder internet ou executar `demo-down.sh`, o link
  deixa de funcionar.
- Os dados persistem nos volumes Docker locais; faca backup antes de qualquer
  limpeza manual de volumes.

<!-- COMPROMISSO-GERAL-A-CASTILHO -->

---

## Compromisso Geral

**Sempre na melhor prática. No caminho do bem maior.**

**Ir até o fim sem sair do caminho, seja ele qual for.**

