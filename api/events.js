const { client, initDB } = require('./db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initDB();

  if (req.method === 'GET') {
    const { start, end } = req.query;
    let result;
    if (start && end) {
      result = await client.execute({
        sql: 'SELECT * FROM events WHERE start_time >= ? AND start_time <= ? ORDER BY start_time',
        args: [start, end],
      });
    } else {
      result = await client.execute('SELECT * FROM events ORDER BY start_time DESC LIMIT 200');
    }
    return res.json(result.rows);
  }

  if (req.method === 'POST') {
    const { title, description, start_time, end_time, location, meeting_link, color, is_blocking } = req.body;
    if (!title || !start_time || !end_time) return res.status(400).json({ error: 'title, start_time, end_time required' });
    const result = await client.execute({
      sql: 'INSERT INTO events (title, description, start_time, end_time, location, meeting_link, color, is_blocking) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [title, description || '', start_time, end_time, location || '', meeting_link || '', color || '#4A90D9', is_blocking ? 1 : 0],
    });
    return res.json({ id: Number(result.lastInsertRowid), ...req.body });
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const { title, description, start_time, end_time, location, meeting_link, color, is_blocking, status } = req.body;
    await client.execute({
      sql: 'UPDATE events SET title=?, description=?, start_time=?, end_time=?, location=?, meeting_link=?, color=?, is_blocking=?, status=? WHERE id=?',
      args: [title, description, start_time, end_time, location, meeting_link, color, is_blocking ? 1 : 0, status || 'confirmed', id],
    });
    return res.json({ success: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await client.execute({ sql: 'DELETE FROM events WHERE id=?', args: [id] });
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
