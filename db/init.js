const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use DATA_DIR env var for persistent storage in production, fallback to local
const dataDir = process.env.DATA_DIR || __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'calendar.db');
const db = new Database(dbPath);
console.log(`📦 Database: ${dbPath}`);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    location TEXT DEFAULT '',
    meeting_link TEXT DEFAULT '',
    color TEXT DEFAULT '#4A90D9',
    is_blocking INTEGER DEFAULT 0,
    status TEXT DEFAULT 'confirmed',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL,
    start_hour TEXT NOT NULL,
    end_hour TEXT NOT NULL,
    enabled INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS appointment_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    requested_date TEXT NOT NULL,
    requested_start TEXT NOT NULL,
    requested_end TEXT NOT NULL,
    meeting_link TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    owner_note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed default availability (Mon-Fri, 9am-5pm) if empty
const count = db.prepare('SELECT COUNT(*) as c FROM availability').get();
if (count.c === 0) {
  const insert = db.prepare('INSERT INTO availability (day_of_week, start_hour, end_hour, enabled) VALUES (?, ?, ?, ?)');
  for (let d = 1; d <= 5; d++) {
    insert.run(d, '09:00', '17:00', 1);
  }
  // Weekend disabled
  insert.run(0, '10:00', '14:00', 0);
  insert.run(6, '10:00', '14:00', 0);
}

module.exports = db;
