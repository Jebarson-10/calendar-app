const express = require('express');
const path = require('path');
const db = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3456;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Make db available to routes
app.locals.db = db;

// Routes
app.use('/', require('./routes/dashboard'));
app.use('/api/events', require('./routes/api-events'));
app.use('/api/availability', require('./routes/api-availability'));
app.use('/api/requests', require('./routes/api-requests'));
app.use('/book', require('./routes/booking'));

// Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📅 Calendar app running at http://localhost:${PORT}`);
  console.log(`📋 Public booking page: http://localhost:${PORT}/book`);
});
