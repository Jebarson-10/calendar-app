const { client, initDB } = require('./db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initDB();

  if (req.method === 'GET') {
    // Return availability for the booking page
    const result = await client.execute('SELECT * FROM availability ORDER BY day_of_week');
    return res.json(result.rows);
  }

  if (req.method === 'POST') {
    const { requester_name, requester_email, title, description, requested_date, requested_start, requested_end, meeting_link } = req.body;
    if (!requester_name || !requester_email || !title || !requested_date || !requested_start || !requested_end) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Check conflicts
    const start_time = `${requested_date}T${requested_start}`;
    const end_time = `${requested_date}T${requested_end}`;
    const conflict = await client.execute({
      sql: "SELECT * FROM events WHERE start_time < ? AND end_time > ? AND status != 'cancelled'",
      args: [end_time, start_time],
    });
    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'This time slot conflicts with an existing event. Please choose another time.' });
    }

    const result = await client.execute({
      sql: 'INSERT INTO appointment_requests (requester_name, requester_email, title, description, requested_date, requested_start, requested_end, meeting_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [requester_name, requester_email, title, description || '', requested_date, requested_start, requested_end, meeting_link || ''],
    });
    return res.json({ success: true, id: Number(result.lastInsertRowid), message: 'Your appointment request has been submitted!' });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
