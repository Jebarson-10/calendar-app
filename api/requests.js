const { client, initDB } = require('./db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initDB();

  if (req.method === 'GET') {
    const { status } = req.query;
    let result;
    if (status) {
      result = await client.execute({ sql: 'SELECT * FROM appointment_requests WHERE status=? ORDER BY requested_date, requested_start', args: [status] });
    } else {
      result = await client.execute('SELECT * FROM appointment_requests ORDER BY created_at DESC');
    }
    return res.json(result.rows);
  }

  if (req.method === 'POST') {
    const { action, id } = req.query;
    const { owner_note } = req.body || {};

    if (action === 'approve') {
      const reqResult = await client.execute({ sql: 'SELECT * FROM appointment_requests WHERE id=?', args: [id] });
      if (reqResult.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
      const r = reqResult.rows[0];
      const start_time = `${r.requested_date}T${r.requested_start}`;
      const end_time = `${r.requested_date}T${r.requested_end}`;
      await client.execute({
        sql: "INSERT INTO events (title, description, start_time, end_time, meeting_link, status) VALUES (?, ?, ?, ?, ?, ?)",
        args: [`${r.title} (with ${r.requester_name})`, r.description, start_time, end_time, r.meeting_link, 'confirmed'],
      });
      await client.execute({ sql: 'UPDATE appointment_requests SET status=?, owner_note=? WHERE id=?', args: ['approved', owner_note || '', id] });
      return res.json({ success: true });
    }

    if (action === 'decline') {
      await client.execute({ sql: 'UPDATE appointment_requests SET status=?, owner_note=? WHERE id=?', args: ['declined', owner_note || '', id] });
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Missing action parameter' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await client.execute({ sql: 'DELETE FROM appointment_requests WHERE id=?', args: [id] });
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
