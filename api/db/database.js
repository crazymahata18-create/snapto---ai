const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

let db;

async function getDb() {
  if (db) return db;
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await initDb();
  return db;
}

async function initDb() {
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT,
      last_login DATETIME,
      last_active DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add columns to users if they don't exist
  const tableInfo = await db.all("PRAGMA table_info(users)");
  const hasLastLogin = tableInfo.some(col => col.name === 'last_login');
  if (!hasLastLogin) {
    try {
      await db.exec('ALTER TABLE users ADD COLUMN last_login DATETIME');
      await db.exec('ALTER TABLE users ADD COLUMN last_active DATETIME');
      console.log('[DB] Migrated users table with new columns');
    } catch (err) {
      console.error('[DB] Migration error:', err.message);
    }
  }

  // Leads table (Pre-orders)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      status TEXT DEFAULT 'waitlist',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Meetings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      company TEXT,
      date TEXT,
      time TEXT,
      status TEXT DEFAULT 'confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Alerts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT,
      severity TEXT,
      camera_id TEXT,
      description TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved INTEGER DEFAULT 0
    )
  `);

  // Seed default admin user if none exists
  const adminExists = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    const hashedPw = await bcrypt.hash('admin123', 10);
    await db.run(
      'INSERT INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)',
      ['usr_1', 'admin', hashedPw, 'Director Sharma', 'admin']
    );
    console.log('[DB] Seeded default admin account (admin / admin123)');
  }
}

module.exports = { getDb };
