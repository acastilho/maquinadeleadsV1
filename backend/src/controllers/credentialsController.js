const db = require('../config/db');
const { assertNicheOwnership } = require('../utils/ownership');

const ALLOWED_PROVIDERS = new Set(['postgres_n8n', 'serper', 'evolution_api']);

function publicCredential(row) {
  return {
    id: row.id,
    niche_id: row.niche_id,
    provider: row.provider,
    configured: Boolean(row.api_key),
    base_url: row.base_url,
    extra_config: row.extra_config,
    created_at: row.created_at,
  };
}

async function upsert(req, res) {
  const { nicheId } = req.params;
  const { provider, apiKey, baseUrl, extraConfig } = req.body;

  try {
    if (!(await assertNicheOwnership(nicheId, req.user.sub))) {
      return res.status(403).json({ error: 'Acesso negado a este nicho.' });
    }
    if (!ALLOWED_PROVIDERS.has(provider)) return res.status(400).json({ error: 'Provider invalido.' });

    const result = await db.query(
      `INSERT INTO credentials (niche_id, provider, api_key, base_url, extra_config)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (niche_id, provider)
       DO UPDATE SET api_key = COALESCE(EXCLUDED.api_key, credentials.api_key), base_url = COALESCE(EXCLUDED.base_url, credentials.base_url), extra_config = EXCLUDED.extra_config
       RETURNING id, niche_id, provider, api_key, base_url, extra_config, created_at`,
      [nicheId, provider, apiKey || null, baseUrl || null, JSON.stringify(extraConfig || {})]
    );

    res.status(200).json({ credential: publicCredential(result.rows[0]) });
  } catch (err) {
    console.error('[credentials.upsert] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao salvar credencial.' });
  }
}

async function list(req, res) {
  const { nicheId } = req.params;

  try {
    if (!(await assertNicheOwnership(nicheId, req.user.sub))) {
      return res.status(403).json({ error: 'Acesso negado a este nicho.' });
    }
    const result = await db.query(
      'SELECT id, niche_id, provider, (api_key IS NOT NULL) AS configured, base_url, extra_config, created_at FROM credentials WHERE niche_id = $1',
      [nicheId]
    );
    res.json({ credentials: result.rows });
  } catch (err) {
    console.error('[credentials.list] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao listar credenciais.' });
  }
}

async function copyFrom(req, res) {
  const { nicheId } = req.params;
  const { sourceNicheId } = req.body;
  try {
    const ownsTarget = await assertNicheOwnership(nicheId, req.user.sub);
    const ownsSource = sourceNicheId && await assertNicheOwnership(sourceNicheId, req.user.sub);
    if (!ownsTarget || !ownsSource) return res.status(404).json({ error: 'Nicho nao encontrado.' });
    await db.query(
      `INSERT INTO credentials (niche_id, provider, api_key, base_url, extra_config)
       SELECT $1, provider, api_key, base_url, extra_config FROM credentials WHERE niche_id = $2
       ON CONFLICT (niche_id, provider) DO UPDATE
       SET api_key = EXCLUDED.api_key, base_url = EXCLUDED.base_url, extra_config = EXCLUDED.extra_config`,
      [nicheId, sourceNicheId]
    );
    return list(req, res);
  } catch (err) {
    console.error('[credentials.copyFrom] Erro:', err.message);
    return res.status(500).json({ error: 'Erro ao importar credenciais.' });
  }
}

module.exports = { upsert, list, copyFrom };
