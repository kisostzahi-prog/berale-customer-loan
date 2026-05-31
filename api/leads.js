const { Pool } = require('pg');

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'berale2025';

async function ensureTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT NOT NULL DEFAULT ''
    )
  `);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getPool();
  await ensureTable(db);

  if (req.method === 'POST') {
    const { id, name, phone } = req.body || {};
    if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });
    const leadId = id || ('L' + Date.now());
    await db.query(
      'INSERT INTO leads (id, name, phone) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
      [leadId, name.trim(), phone.trim()]
    );
    return res.status(201).json({ ok: true, id: leadId });
  }

  if (req.method === 'GET') {
    if (req.headers.authorization !== `Bearer ${ADMIN_PASS}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { rows } = await db.query(
      'SELECT id, created_at AS "createdAt", name, phone, status, notes FROM leads ORDER BY created_at DESC'
    );
    return res.json(rows);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
