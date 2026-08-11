ALTER TABLE users ALTER COLUMN role SET DEFAULT 'operator';

UPDATE users SET role = 'operator' WHERE role NOT IN ('admin', 'operator') OR role IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'operator'));
  END IF;
END $$;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS observacao TEXT,
  ADD COLUMN IF NOT EXISTS email VARCHAR(320),
  ADD COLUMN IF NOT EXISTS descricao_extra TEXT,
  ADD COLUMN IF NOT EXISTS enrichment_status VARCHAR(20) DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;

UPDATE leads SET enrichment_status = 'pendente' WHERE enrichment_status IS NULL;
ALTER TABLE leads ALTER COLUMN enrichment_status SET DEFAULT 'pendente';
ALTER TABLE leads ALTER COLUMN enrichment_status SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_niche_enrichment ON leads (niche_id, enrichment_status);

UPDATE n8n_agents
SET config_snapshot = jsonb_build_object(
  'agentType', agent_type,
  'workflowName', COALESCE(config_snapshot->>'name', agent_type),
  'redactedAt', NOW()
)
WHERE config_snapshot IS NOT NULL AND config_snapshot <> '{}'::jsonb;
