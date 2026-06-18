import { createClient } from '@libsql/client';

const DB_PATH = process.env.DB_PATH || 'edumanage.db';
const TURSO_URL = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url: TURSO_URL || `file:${DB_PATH}`,
  authToken: TURSO_TOKEN,
});

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      photo_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      teacher TEXT,
      fee_per_session REAL DEFAULT 0,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#6366f1',
      schedule TEXT DEFAULT '[]'
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      birth_date TEXT,
      gender TEXT,
      class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
      parent_name TEXT,
      parent_phone TEXT,
      parent_email TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      status TEXT DEFAULT 'active',
      join_date TEXT,
      created_at TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      score REAL NOT NULL,
      weight INTEGER DEFAULT 1,
      date TEXT,
      note TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'present',
      month INTEGER NOT NULL,
      year INTEGER NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      session_count INTEGER DEFAULT 0,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      paid_at TEXT,
      created_at TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      time_label TEXT,
      status TEXT DEFAULT 'pending',
      type TEXT DEFAULT 'clock',
      created_at TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      content TEXT,
      rating REAL DEFAULT 0,
      created_at TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name TEXT,
      account_number TEXT,
      account_name TEXT,
      short_name TEXT
    )
  `);
  console.log('Database tables initialized');
}

function sanitize(params?: any[]) {
  return (params || []).map(p => p === undefined ? null : p);
}

export async function query(text: string, params?: any[]) {
  const result = await db.execute({ sql: text, args: sanitize(params) });
  return { rows: result.rows as any[] };
}

export async function execute(text: string, params?: any[]) {
  const result = await db.execute({ sql: text, args: sanitize(params) });
  return result;
}
