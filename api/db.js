const { createClient } = require('@libsql/client');

// Turso database client - set these env vars in Vercel dashboard
const client = createClient({
  url: process.env.TURSO_DB_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

// Initialize tables
async function initDB() {
  await client.executeMultiple(`
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

  // Seed availability if empty
  const count = await client.execute('SELECT COUNT(*) as c FROM availability');
  if (count.rows[0].c === 0) {
    for (let d = 1; d <= 5; d++) {
      await client.execute({
        sql: 'INSERT INTO availability (day_of_week, start_hour, end_hour, enabled) VALUES (?, ?, ?, ?)',
        args: [d, '09:00', '17:00', 1],
      });
    }
    await client.execute({ sql: 'INSERT INTO availability (day_of_week, start_hour, end_hour, enabled) VALUES (?, ?, ?, ?)', args: [0, '10:00', '14:00', 0] });
    await client.execute({ sql: 'INSERT INTO availability (day_of_week, start_hour, end_hour, enabled) VALUES (?, ?, ?, ?)', args: [6, '10:00', '14:00', 0] });
  }
}

module.exports = { client, initDB };
