const { client, initDB } = require('./db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initDB();

  if (req.method === 'GET') {
    const result = await client.execute('SELECT * FROM availability ORDER BY day_of_week');
    return res.json(result.rows);
  }

  if (req.method === 'PUT') {
    const { day } = req.query;
    const { start_hour, end_hour, enabled } = req.body;
    await client.execute({
      sql: 'UPDATE availability SET start_hour=?, end_hour=?, enabled=? WHERE day_of_week=?',
      args: [start_hour, end_hour, enabled ? 1 : 0, day],
    });
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
