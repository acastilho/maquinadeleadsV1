# Alterações automáticas — etapas 1 e 2

## Antes de iniciar

1. Rotacione `JWT_SECRET`, `N8N_API_KEY`, senha do PostgreSQL, senha do n8n,
   chaves Serper e Evolution API que estavam no pacote anterior.
2. Copie os arquivos `.env.example` para `.env` e preencha somente com valores novos.
3. Não reutilize o `.env` enviado anteriormente.

## Aplicar banco

No backend, execute:

```bash
npm run migrate
```

O comando registra migrations em `schema_migrations`, pode ser executado novamente
com segurança e aplica a migration `002_security_and_enrichment.sql` em bancos existentes.

## Principais correções

- Helmet, CORS restrito, rate limiting e limite de payload no servidor realmente executado.
- Falha rápida quando `JWT_SECRET` está ausente ou tem menos de 32 caracteres.
- Novos cadastros públicos recebem papel `operator`.
- API não retorna mais `api_key`; retorna apenas `configured`.
- Importação de credenciais ocorre no backend, sem expor chaves ao navegador.
- Snapshots novos não contêm o JSON completo do workflow nem credenciais.
- Migration higieniza snapshots antigos e adiciona os campos de enriquecimento ausentes.
- Senhas fixas foram removidas do Docker Compose.

## Validações concluídas

- Build de produção do frontend.
- Verificação sintática de todos os arquivos JavaScript do backend.
- `npm audit --omit=dev` do backend: zero vulnerabilidades conhecidas.

O teste integrado da migration exige uma instância PostgreSQL configurada e não foi
executado neste ambiente.
