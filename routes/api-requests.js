const express = require('express');
const router = express.Router();

// Get all requests (with optional status filter)
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { status } = req.query;
  let rows;
  if (status) {
    rows = db.prepare('SELECT * FROM appointment_requests WHERE status=? ORDER BY requested_date, requested_start').all(status);
  } else {
    rows = db.prepare('SELECT * FROM appointment_requests ORDER BY created_at DESC').all();
  }
  res.json(rows);
});

// Approve request → creates an event
router.post('/:id/approve', (req, res) => {
  const db = req.app.locals.db;
  const { owner_note } = req.body;
  const request = db.prepare('SELECT * FROM appointment_requests WHERE id=?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  // Create event from the request
  const start_time = `${request.requested_date}T${request.requested_start}`;
  const end_time = `${request.requested_date}T${request.requested_end}`;
  db.prepare(
    'INSERT INTO events (title, description, start_time, end_time, meeting_link, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    `${request.title} (with ${request.requester_name})`,
    request.description,
    start_time,
    end_time,
    request.meeting_link,
    'confirmed'
  );

  db.prepare('UPDATE appointment_requests SET status=?, owner_note=? WHERE id=?')
    .run('approved', owner_note || '', req.params.id);
  res.json({ success: true });
});

// Decline request
router.post('/:id/decline', (req, res) => {
  const db = req.app.locals.db;
  const { owner_note } = req.body;
  db.prepare('UPDATE appointment_requests SET status=?, owner_note=? WHERE id=?')
    .run('declined', owner_note || '', req.params.id);
  res.json({ success: true });
});

// Delete request
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM appointment_requests WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
