const express = require('express');
const router = express.Router();

// Public booking page
router.get('/', (req, res) => {
  res.render('booking');
});

// Submit appointment request
router.post('/request', (req, res) => {
  const db = req.app.locals.db;
  const { requester_name, requester_email, title, description, requested_date, requested_start, requested_end, meeting_link } = req.body;

  if (!requester_name || !requester_email || !title || !requested_date || !requested_start || !requested_end) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }

  // Check for conflicts with existing events
  const start_time = `${requested_date}T${requested_start}`;
  const end_time = `${requested_date}T${requested_end}`;
  const conflict = db.prepare(
    "SELECT * FROM events WHERE start_time < ? AND end_time > ? AND status != 'cancelled'"
  ).all(end_time, start_time);

  if (conflict.length > 0) {
    return res.status(409).json({ error: 'This time slot conflicts with an existing event. Please choose another time.' });
  }

  const result = db.prepare(
    'INSERT INTO appointment_requests (requester_name, requester_email, title, description, requested_date, requested_start, requested_end, meeting_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(requester_name, requester_email, title, description || '', requested_date, requested_start, requested_end, meeting_link || '');

  res.json({ success: true, id: result.lastInsertRowid, message: 'Your appointment request has been submitted! You will be notified once it is reviewed.' });
});

module.exports = router;
