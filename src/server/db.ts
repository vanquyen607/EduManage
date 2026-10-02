import { createClient } from '@libsql/client';

const DB_PATH = process.env.DB_PATH || 'edumanage.db';
const TURSO_URL = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url: TURSO_URL || `file:${DB_PATH}`,
  authToken: TURSO_TOKEN,
});

export async function initDb() {
  await db.batch([
    { sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        display_name TEXT,
        photo_url TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )` },
    { sql: `
      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        teacher TEXT,
        fee_per_session REAL DEFAULT 0,
        description TEXT DEFAULT '',
        color TEXT DEFAULT '#6366f1',
        schedule TEXT DEFAULT '[]'
      )` },
    { sql: `
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
      )` },
    { sql: `
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
      )` },
    { sql: `
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        status TEXT DEFAULT 'present',
        month INTEGER NOT NULL,
        year INTEGER NOT NULL
      )` },
    { sql: `
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
      )` },
    { sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        time_label TEXT,
        status TEXT DEFAULT 'pending',
        type TEXT DEFAULT 'clock',
        created_at TEXT
      )` },
    { sql: `
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        content TEXT,
        rating REAL DEFAULT 0,
        created_at TEXT
      )` },
    { sql: `
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        name TEXT,
        account_number TEXT,
        account_name TEXT,
        short_name TEXT
      )` },
  ], 'write');

  const uniqIdx = await db.execute({
    sql: `SELECT name FROM sqlite_master WHERE type='index' AND name='idx_invoices_unique'`,
  });
  if (uniqIdx.rows.length === 0) {
    await db.execute(`
      DELETE FROM invoices WHERE rowid NOT IN (
        SELECT MIN(rowid) FROM invoices GROUP BY owner_id, student_id, month, year
      )
    `);
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_unique
      ON invoices(owner_id, student_id, month, year)
    `);
  }

  await db.batch([
    `CREATE INDEX IF NOT EXISTS idx_classes_owner ON classes(owner_id)`,
    `CREATE INDEX IF NOT EXISTS idx_students_owner ON students(owner_id)`,
    `CREATE INDEX IF NOT EXISTS idx_students_owner_status ON students(owner_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id)`,
    `CREATE INDEX IF NOT EXISTS idx_grades_owner ON grades(owner_id)`,
    `CREATE INDEX IF NOT EXISTS idx_grades_owner_student ON grades(owner_id, student_id)`,
    `CREATE INDEX IF NOT EXISTS idx_grades_owner_class ON grades(owner_id, class_id)`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_owner_student_period ON attendance(owner_id, student_id, month, year, status)`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_owner_date ON attendance(owner_id, date)`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_owner_class_date ON attendance(owner_id, class_id, date)`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_owner_period ON invoices(owner_id, month, year)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_owner ON notifications(owner_id)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_owner_student ON comments(owner_id, student_id)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_owner_period ON comments(owner_id, month, year)`,
  ], 'write');

  console.log('Database tables & indexes verified (IF NOT EXISTS)');
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

export async function batch(stmts: { sql: string; args?: any[] }[]) {
  return db.batch(
    stmts.map(s => ({ sql: s.sql, args: sanitize(s.args) })),
    'write'
  );
}
