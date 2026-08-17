const express = require('express');
const router = express.Router();

// Get all events (optionally filtered by month)
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { start, end } = req.query;
  let events;
  if (start && end) {
    events = db.prepare('SELECT * FROM events WHERE start_time >= ? AND start_time <= ? ORDER BY start_time').all(start, end);
  } else {
    events = db.prepare('SELECT * FROM events ORDER BY start_time DESC LIMIT 200').all();
  }
  res.json(events);
});

// Create event
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const { title, description, start_time, end_time, location, meeting_link, color, is_blocking } = req.body;
  if (!title || !start_time || !end_time) {
    return res.status(400).json({ error: 'title, start_time, end_time required' });
  }
  const result = db.prepare(
    'INSERT INTO events (title, description, start_time, end_time, location, meeting_link, color, is_blocking) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(title, description || '', start_time, end_time, location || '', meeting_link || '', color || '#4A90D9', is_blocking ? 1 : 0);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

// Update event
router.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { title, description, start_time, end_time, location, meeting_link, color, is_blocking, status } = req.body;
  db.prepare(
    'UPDATE events SET title=?, description=?, start_time=?, end_time=?, location=?, meeting_link=?, color=?, is_blocking=?, status=? WHERE id=?'
  ).run(title, description, start_time, end_time, location, meeting_link, color, is_blocking ? 1 : 0, status || 'confirmed', req.params.id);
  res.json({ success: true });
});

// Delete event
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM events WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
