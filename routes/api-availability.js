const express = require('express');
const router = express.Router();

// Get availability
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const rows = db.prepare('SELECT * FROM availability ORDER BY day_of_week').all();
  res.json(rows);
});

// Update availability for a day
router.put('/:day', (req, res) => {
  const db = req.app.locals.db;
  const { start_hour, end_hour, enabled } = req.body;
  db.prepare('UPDATE availability SET start_hour=?, end_hour=?, enabled=? WHERE day_of_week=?')
    .run(start_hour, end_hour, enabled ? 1 : 0, req.params.day);
  res.json({ success: true });
});

module.exports = router;
