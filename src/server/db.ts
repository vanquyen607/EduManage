import pg from 'pg';

const isRemote = !!process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString: isRemote ? process.env.DATABASE_URL : 'postgresql://postgres:postgres@localhost:5432/edumanage',
  ...(isRemote ? { ssl: { rejectUnauthorized: false } } : {}),
});

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        display_name TEXT,
        photo_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        teacher TEXT,
        fee_per_session REAL DEFAULT 0,
        description TEXT DEFAULT '',
        color TEXT DEFAULT '#6366f1',
        schedule JSONB DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        birth_date TEXT,
        gender TEXT,
        class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
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
      );

      CREATE TABLE IF NOT EXISTS grades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        score REAL NOT NULL,
        weight INTEGER DEFAULT 1,
        date TEXT,
        note TEXT
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        status TEXT DEFAULT 'present',
        month INTEGER NOT NULL,
        year INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        session_count INTEGER DEFAULT 0,
        total_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        paid_at TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        time_label TEXT,
        status TEXT DEFAULT 'pending',
        type TEXT DEFAULT 'clock',
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        content TEXT,
        rating REAL DEFAULT 0,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        name TEXT,
        account_number TEXT,
        account_name TEXT,
        short_name TEXT
      );
    `);
    console.log('Database tables initialized');
  } finally {
    client.release();
  }
}

export function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export function getClient() {
  return pool.connect();
}

export default pool;
