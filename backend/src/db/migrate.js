const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const baseline = await client.query("SELECT 1 FROM schema_migrations WHERE name = '001_baseline.sql'");
    if (!baseline.rowCount) {
      await client.query('BEGIN');
      try {
        await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
        await client.query("INSERT INTO schema_migrations (name) VALUES ('001_baseline.sql')");
        await client.query('COMMIT');
        console.log('✅ Migration aplicada: 001_baseline.sql');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
    for (const file of files) {
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
      if (applied.rowCount) continue;
      await client.query('BEGIN');
      try {
        await client.query(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Migration aplicada: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
    console.log('✅ Banco atualizado com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao aplicar migrations:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
