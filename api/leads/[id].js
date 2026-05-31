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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.headers.authorization !== `Bearer ${ADMIN_PASS}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const db = getPool();

  if (req.method === 'PATCH') {
    const { status, notes } = req.body || {};
    const cols = [], vals = [];
    let i = 1;
    if (status !== undefined) { cols.push(`status = $${i++}`); vals.push(status); }
    if (notes !== undefined)  { cols.push(`notes = $${i++}`);  vals.push(notes); }
    if (!cols.length) return res.status(400).json({ error: 'nothing to update' });
    vals.push(id);
    await db.query(`UPDATE leads SET ${cols.join(', ')} WHERE id = $${i}`, vals);
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    await db.query('DELETE FROM leads WHERE id = $1', [id]);
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
