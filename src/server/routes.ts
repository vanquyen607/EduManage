import { Router, Request, Response } from 'express';
import { query } from './db';
import { authMiddleware, hashPassword, verifyPassword, generateToken } from './auth';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

const emailSchema = z.string().email().max(255);
const passwordSchema = z.string().min(6).max(128);
const nameSchema = z.string().min(2).max(100);

function validate(schema: z.ZodType<any>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { ok: false as const, error: msg };
  }
  return { ok: true as const, data: result.data };
}

function requireAuth(handler: (req: any, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: any) => {
    authMiddleware(req, res, () => handler(req, res).catch((e: any) => res.status(500).json({ error: e.message })));
  };
}

function uuid() { return crypto.randomUUID(); }

// ─── AUTH ────────────────────────────────────────────
router.post('/api/auth/register', async (req: Request, res: Response) => {
  const v = validate(z.object({ email: emailSchema, password: passwordSchema, displayName: z.string().min(2).max(100).optional() }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { email, password, displayName } = v.data;

  const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already exists' });

  const hashed = await hashPassword(password);
  const id = uuid();
  await query(
    'INSERT INTO users (id, email, password, display_name) VALUES (?, ?, ?, ?)',
    [id, email, hashed, displayName || null]
  );
  const result = await query('SELECT id, email, display_name, photo_url, created_at FROM users WHERE id = ?', [id]);
  const user = result.rows[0];
  const token = generateToken(user);
  res.json({ user: { id: user.id, email: user.email, displayName: user.display_name, photoURL: user.photo_url }, token });
});

router.post('/api/auth/login', async (req: Request, res: Response) => {
  const v = validate(z.object({ email: emailSchema, password: passwordSchema }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { email, password } = v.data;

  const result = await query('SELECT id, email, password, display_name, photo_url FROM users WHERE email = ?', [email]);
  if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

  const user = result.rows[0];
  const valid = await verifyPassword(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = generateToken(user);
  res.json({ user: { id: user.id, email: user.email, displayName: user.display_name, photoURL: user.photo_url }, token });
});

router.get('/api/auth/me', authMiddleware, (req: any, res: Response) => {
  res.json({ user: req.user });
});

router.put('/api/auth/profile', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({ displayName: z.string().min(2).max(100).optional(), email: emailSchema.optional() }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { displayName, email } = v.data;
  if (displayName) await query('UPDATE users SET display_name = ? WHERE id = ?', [displayName, req.user.id]);
  if (email) {
    const existing = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already in use' });
    await query('UPDATE users SET email = ? WHERE id = ?', [email, req.user.id]);
  }
  const result = await query('SELECT id, email, display_name, photo_url FROM users WHERE id = ?', [req.user.id]);
  const user = result.rows[0];
  res.json({ user: { id: user.id, email: user.email, displayName: user.display_name, photoURL: user.photo_url } });
});

// ─── STUDENTS ────────────────────────────────────────
router.get('/api/students', authMiddleware, async (req: any, res: Response) => {
  const result = await query('SELECT * FROM students WHERE owner_id = ? ORDER BY name ASC', [req.user.id]);
  res.json(result.rows);
});

router.post('/api/students', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    name: nameSchema, birthDate: z.string().optional(), gender: z.enum(['male', 'female', 'other']).optional(),
    classId: z.string().optional(), parentName: z.string().min(2).max(100).optional(), parentPhone: z.string().min(8).max(15).optional(),
    parentEmail: z.string().email().optional().or(z.literal('')), email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(), address: z.string().max(500).optional(), notes: z.string().max(1000).optional(),
    status: z.string().optional(), joinDate: z.string().optional(),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { name, birthDate, gender, classId, parentName, parentPhone, parentEmail, email, phone, address, notes, status, joinDate } = v.data;
  const id = uuid();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO students (id, owner_id, name, birth_date, gender, class_id, parent_name, parent_phone, parent_email, email, phone, address, notes, status, join_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, name, birthDate, gender, classId, parentName, parentPhone, parentEmail, email, phone, address, notes, status || 'active', joinDate, now]
  );
  const result = await query('SELECT * FROM students WHERE id = ?', [id]);
  res.json(result.rows[0]);
});

router.put('/api/students/:id', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    name: nameSchema.optional(), birthDate: z.string().optional(), gender: z.enum(['male', 'female', 'other']).optional(),
    classId: z.string().optional(), parentName: z.string().min(2).max(100).optional(), parentPhone: z.string().min(8).max(15).optional(),
    parentEmail: z.string().email().optional().or(z.literal('')), email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(), address: z.string().max(500).optional(), notes: z.string().max(1000).optional(),
    status: z.string().optional(), joinDate: z.string().optional(),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const fields = v.data as Record<string, any>;
  const colMap: Record<string, string> = {
    name: 'name', birthDate: 'birth_date', gender: 'gender', classId: 'class_id',
    parentName: 'parent_name', parentPhone: 'parent_phone', parentEmail: 'parent_email',
    email: 'email', phone: 'phone', address: 'address', notes: 'notes', status: 'status', joinDate: 'join_date',
  };
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [key, col] of Object.entries(colMap)) {
    if (fields[key] !== undefined) { sets.push(`${col}=?`); vals.push(fields[key]); }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  vals.push(req.params.id, req.user.id);
  await query(`UPDATE students SET ${sets.join(',')} WHERE id=? AND owner_id=?`, vals);
  res.json({ success: true });
});

router.delete('/api/students/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM students WHERE id=? AND owner_id=?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── CLASSES ─────────────────────────────────────────
function parseClass(c: any) {
  if (typeof c.schedule === 'string') try { c.schedule = JSON.parse(c.schedule); } catch { c.schedule = []; }
  return c;
}

router.get('/api/classes', authMiddleware, async (req: any, res: Response) => {
  const result = await query('SELECT * FROM classes WHERE owner_id = ? ORDER BY name ASC', [req.user.id]);
  res.json(result.rows.map(parseClass));
});

router.post('/api/classes', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    name: nameSchema, teacher: z.string().max(100).optional(), feePerSession: z.number().min(0).max(100000000),
    description: z.string().max(500).optional(), color: z.string().optional(),
    schedule: z.array(z.object({ dayOfWeek: z.number().min(0).max(6), startTime: z.string(), endTime: z.string(), teacher: z.string().optional() })).optional(),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { name, teacher, feePerSession, description, color, schedule } = v.data;
  const id = uuid();
  await query(
    `INSERT INTO classes (id, owner_id, name, teacher, fee_per_session, description, color, schedule)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, name, teacher, feePerSession, description, color || '#6366f1', JSON.stringify(schedule || [])]
  );
  const result = await query('SELECT * FROM classes WHERE id = ?', [id]);
  res.json(parseClass(result.rows[0]));
});

router.put('/api/classes/:id', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    name: nameSchema.optional(), teacher: z.string().max(100).optional(), feePerSession: z.number().min(0).optional(),
    description: z.string().max(500).optional(), color: z.string().optional(),
    schedule: z.array(z.object({ dayOfWeek: z.number().min(0).max(6), startTime: z.string(), endTime: z.string(), teacher: z.string().optional() })).optional(),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const fields = v.data as Record<string, any>;
  const colMap: Record<string, string> = {
    name: 'name', teacher: 'teacher', feePerSession: 'fee_per_session',
    description: 'description', color: 'color',
  };
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [key, col] of Object.entries(colMap)) {
    if (fields[key] !== undefined) { sets.push(`${col}=?`); vals.push(fields[key]); }
  }
  if (fields.schedule !== undefined) {
    sets.push('schedule=?');
    vals.push(JSON.stringify(fields.schedule));
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  vals.push(req.params.id, req.user.id);
  await query(`UPDATE classes SET ${sets.join(',')} WHERE id=? AND owner_id=?`, vals);
  res.json({ success: true });
});

router.delete('/api/classes/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM classes WHERE id=? AND owner_id=?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── GRADES ──────────────────────────────────────────
router.get('/api/grades', authMiddleware, async (req: any, res: Response) => {
  const result = await query('SELECT * FROM grades WHERE owner_id = ? ORDER BY date DESC', [req.user.id]);
  res.json(result.rows);
});

router.post('/api/grades', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    studentId: z.string().min(1), classId: z.string().min(1), subject: z.string().min(1).max(100),
    score: z.number().min(0).max(10), weight: z.number().min(1).max(4), date: z.string().min(1), note: z.string().max(500).optional(),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { studentId, classId, subject, score, weight, date, note } = v.data;
  const id = uuid();
  await query(
    `INSERT INTO grades (id, owner_id, student_id, class_id, subject, score, weight, date, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, studentId, classId, subject, score, weight, date, note]
  );
  const result = await query('SELECT * FROM grades WHERE id = ?', [id]);
  res.json(result.rows[0]);
});

router.put('/api/grades/:id', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    studentId: z.string().min(1).optional(), classId: z.string().min(1).optional(), subject: z.string().min(1).max(100).optional(),
    score: z.number().min(0).max(10).optional(), weight: z.number().min(1).max(4).optional(), date: z.string().min(1).optional(), note: z.string().max(500).optional(),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const fields = v.data as Record<string, any>;
  const colMap: Record<string, string> = { studentId: 'student_id', classId: 'class_id', subject: 'subject', score: 'score', weight: 'weight', date: 'date', note: 'note' };
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [key, col] of Object.entries(colMap)) {
    if (fields[key] !== undefined) { sets.push(`${col}=?`); vals.push(fields[key]); }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  vals.push(req.params.id, req.user.id);
  await query(`UPDATE grades SET ${sets.join(',')} WHERE id=? AND owner_id=?`, vals);
  res.json({ success: true });
});

router.delete('/api/grades/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM grades WHERE id=? AND owner_id=?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── ATTENDANCE ──────────────────────────────────────
router.get('/api/attendance', authMiddleware, async (req: any, res: Response) => {
  const { classId, date, studentId, month, year } = req.query;
  let sql = 'SELECT * FROM attendance WHERE owner_id = ?';
  const params: any[] = [req.user.id];
  if (classId) { sql += ' AND class_id = ?'; params.push(classId); }
  if (date) { sql += ' AND date = ?'; params.push(date); }
  if (studentId) { sql += ' AND student_id = ?'; params.push(studentId); }
  if (month) { sql += ' AND month = ?'; params.push(parseInt(month as string)); }
  if (year) { sql += ' AND year = ?'; params.push(parseInt(year as string)); }
  const result = await query(sql, params);
  res.json(result.rows);
});

router.post('/api/attendance', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    studentId: z.string().min(1), classId: z.string().min(1), date: z.string().min(1),
    status: z.string().min(1), month: z.number().min(1).max(12), year: z.number().min(2020).max(2100),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { studentId, classId, date, status, month, year } = v.data;
  const existing = await query('SELECT id FROM attendance WHERE owner_id=? AND student_id=? AND date=?', [req.user.id, studentId, date]);
  if (existing.rows.length > 0) {
    await query('UPDATE attendance SET status=?, class_id=?, month=?, year=? WHERE id=? AND owner_id=?',
      [status, classId, month, year, existing.rows[0].id, req.user.id]);
    res.json({ id: existing.rows[0].id });
  } else {
    const id = uuid();
    await query(
      `INSERT INTO attendance (id, owner_id, student_id, class_id, date, status, month, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, studentId, classId, date, status, month, year]);
    res.json({ id });
  }
});

router.delete('/api/attendance/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM attendance WHERE id=? AND owner_id=?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── INVOICES ────────────────────────────────────────
router.get('/api/invoices', authMiddleware, async (req: any, res: Response) => {
  const result = await query('SELECT * FROM invoices WHERE owner_id = ?', [req.user.id]);
  res.json(result.rows);
});

router.post('/api/invoices', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    studentId: z.string().min(1), month: z.number().min(1).max(12), year: z.number().min(2020).max(2100),
    sessionCount: z.number().min(0), totalAmount: z.number().min(0),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { studentId, month, year, sessionCount, totalAmount } = v.data;
  const id = uuid();
  await query(
    `INSERT INTO invoices (id, owner_id, student_id, month, year, session_count, total_amount, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, studentId, month, year, sessionCount, totalAmount, 'pending', new Date().toISOString()]
  );
  const result = await query('SELECT * FROM invoices WHERE id = ?', [id]);
  res.json(result.rows[0]);
});

router.put('/api/invoices/:id', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({ status: z.string().optional(), paidAt: z.string().optional() }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { status, paidAt } = v.data;
  await query(
    'UPDATE invoices SET status=?, paid_at=? WHERE id=? AND owner_id=?',
    [status || 'pending', paidAt || new Date().toISOString(), req.params.id, req.user.id]
  );
  const result = await query('SELECT * FROM invoices WHERE id=?', [req.params.id]);
  res.json(result.rows[0]);
});

router.delete('/api/invoices/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM invoices WHERE id=? AND owner_id=?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── NOTIFICATIONS ───────────────────────────────────
router.get('/api/notifications', authMiddleware, async (req: any, res: Response) => {
  const result = await query('SELECT * FROM notifications WHERE owner_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json(result.rows);
});

router.post('/api/notifications', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({ title: z.string().min(2).max(200), timeLabel: z.string().min(1).max(100), status: z.string().min(1), type: z.string().min(1) }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { title, timeLabel, status, type } = v.data;
  const id = uuid();
  await query(
    `INSERT INTO notifications (id, owner_id, title, time_label, status, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, title, timeLabel, status, type, new Date().toISOString()]
  );
  const result = await query('SELECT * FROM notifications WHERE id = ?', [id]);
  res.json(result.rows[0]);
});

router.put('/api/notifications/:id', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({ title: z.string().min(2).max(200).optional(), timeLabel: z.string().min(1).max(100).optional(), status: z.string().min(1).optional(), type: z.string().min(1).optional() }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const fields = v.data as Record<string, any>;
  const colMap: Record<string, string> = { title: 'title', timeLabel: 'time_label', status: 'status', type: 'type' };
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [key, col] of Object.entries(colMap)) {
    if (fields[key] !== undefined) { sets.push(`${col}=?`); vals.push(fields[key]); }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  vals.push(req.params.id, req.user.id);
  await query(`UPDATE notifications SET ${sets.join(',')} WHERE id=? AND owner_id=?`, vals);
  res.json({ success: true });
});

router.delete('/api/notifications/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM notifications WHERE id=? AND owner_id=?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── COMMENTS ────────────────────────────────────────
router.get('/api/comments', authMiddleware, async (req: any, res: Response) => {
  const { studentId } = req.query;
  let sql = 'SELECT * FROM comments WHERE owner_id = ?';
  const params: any[] = [req.user.id];
  if (studentId) { sql += ' AND student_id = ? ORDER BY created_at DESC'; params.push(studentId); }
  else { sql += ' ORDER BY created_at DESC'; }
  const result = await query(sql, params);
  res.json(result.rows);
});

router.post('/api/comments', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    studentId: z.string().min(1), month: z.number().min(1).max(12), year: z.number().min(2020).max(2100),
    content: z.string().max(2000).optional(), rating: z.number().min(0).max(5).optional(),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { studentId, month, year, content, rating } = v.data;
  const id = uuid();
  await query(
    `INSERT INTO comments (id, owner_id, student_id, month, year, content, rating, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, studentId, month, year, content, rating || 0, new Date().toISOString()]
  );
  const result = await query('SELECT * FROM comments WHERE id = ?', [id]);
  res.json(result.rows[0]);
});

router.put('/api/comments/:id', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({ content: z.string().max(2000).optional(), rating: z.number().min(0).max(5).optional() }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const fields = v.data as Record<string, any>;
  const sets: string[] = [];
  const vals: any[] = [];
  if (fields.content !== undefined) { sets.push('content=?'); vals.push(fields.content); }
  if (fields.rating !== undefined) { sets.push('rating=?'); vals.push(fields.rating); }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  vals.push(req.params.id, req.user.id);
  await query(`UPDATE comments SET ${sets.join(',')} WHERE id=? AND owner_id=?`, vals);
  res.json({ success: true });
});

router.delete('/api/comments/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM comments WHERE id=? AND owner_id=?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── SETTINGS ────────────────────────────────────────
router.get('/api/settings', authMiddleware, async (req: any, res: Response) => {
  const result = await query('SELECT * FROM settings WHERE owner_id = ?', [req.user.id]);
  if (result.rows.length > 0) {
    const s = result.rows[0];
    res.json({ name: s.name, accountNumber: s.account_number, accountName: s.account_name, shortName: s.short_name });
  } else {
    res.json({ name: 'MB BANK', accountNumber: '123456789', accountName: 'NGUYEN VAN A', shortName: 'mbbank' });
  }
});

router.put('/api/settings', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    name: z.string().min(2).max(100), accountNumber: z.string().min(6).max(20),
    accountName: z.string().min(2).max(200), shortName: z.string().min(2).max(20),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { name, accountNumber, accountName, shortName } = v.data;
  const existing = await query('SELECT id FROM settings WHERE owner_id = ?', [req.user.id]);
  if (existing.rows.length > 0) {
    await query('UPDATE settings SET name=?, account_number=?, account_name=?, short_name=? WHERE owner_id=?',
      [name, accountNumber, accountName, shortName, req.user.id]);
  } else {
    const id = uuid();
    await query('INSERT INTO settings (id, owner_id, name, account_number, account_name, short_name) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.user.id, name, accountNumber, accountName, shortName]);
  }
  res.json({ success: true });
});

// ─── DEMO / UTILITY ──────────────────────────────────
router.post('/api/demo/clear', authMiddleware, async (req: any, res: Response) => {
  const tables = ['invoices', 'attendance', 'grades', 'comments', 'notifications', 'students', 'classes'];
  for (const t of tables) {
    await query(`DELETE FROM ${t} WHERE owner_id = ?`, [req.user.id]);
  }
  res.json({ success: true });
});

router.post('/api/demo/seed', authMiddleware, async (req: any, res: Response) => {
  const uid = req.user.id;
  const classIds: string[] = [];
  const classData = [
    { name: 'IELTS Mastery', color: '#6366f1', teacher: 'Thầy Trung', fee: 150000,
      desc: 'Lớp luyện thi IELTS chuyên sâu',
      sched: [{ dayOfWeek: 1, startTime: '18:00', endTime: '20:00' }, { dayOfWeek: 3, startTime: '18:00', endTime: '20:00' }] },
    { name: 'English For Kids', color: '#f59e0b', teacher: 'Cô Lan', fee: 120000,
      desc: 'Tiếng Anh thiếu nhi vui nhộn',
      sched: [{ dayOfWeek: 2, startTime: '17:00', endTime: '18:30' }, { dayOfWeek: 4, startTime: '17:00', endTime: '18:30' }] },
    { name: 'Business English', color: '#10b981', teacher: 'Thầy James', fee: 200000,
      desc: 'Tiếng Anh giao tiếp công việc',
      sched: [{ dayOfWeek: 5, startTime: '19:00', endTime: '21:00' }] },
  ];
  for (const c of classData) {
    const id = uuid();
    await query('INSERT INTO classes (id, owner_id, name, color, teacher, fee_per_session, description, schedule) VALUES (?,?,?,?,?,?,?,?)',
      [id, uid, c.name, c.color, c.teacher, c.fee, c.desc, JSON.stringify(c.sched)]);
    classIds.push(id);
  }

  const studentData = [
    { name: 'Nguyễn Văn A', parentName: 'Nguyễn Văn B', parentPhone: '0901234567' },
    { name: 'Trần Thị C', parentName: 'Trần Văn D', parentPhone: '0902345678' },
    { name: 'Lê Văn E', parentName: 'Lê Thị F', parentPhone: '0903456789' },
    { name: 'Phạm Minh G', parentName: 'Phạm Văn H', parentPhone: '0904567890' },
  ];
  const studentIds: string[] = [];
  for (let i = 0; i < studentData.length; i++) {
    const s = studentData[i];
    const ci = i < 2 ? classIds[0] : i === 2 ? classIds[1] : classIds[2];
    const sid = uuid();
    await query(
      'INSERT INTO students (id, owner_id, name, class_id, parent_name, parent_phone, status, created_at) VALUES (?,?,?,?,?,?,?,?)',
      [sid, uid, s.name, ci, s.parentName, s.parentPhone, 'active', new Date().toISOString()]
    );
    studentIds.push(sid);
  }

  const subjects = ['Listening', 'Reading', 'Writing', 'Speaking'];
  for (let i = 0; i < studentIds.length; i++) {
    const ci = i < 2 ? classIds[0] : i === 2 ? classIds[1] : classIds[2];
    for (const subject of subjects) {
      const gid = uuid();
      await query('INSERT INTO grades (id, owner_id, student_id, class_id, subject, score, weight, date) VALUES (?,?,?,?,?,?,?,?)',
        [gid, uid, studentIds[i], ci, subject, Math.floor(Math.random() * 5) + 5, 1, new Date().toISOString().split('T')[0]]);
    }
  }

  const nid = uuid();
  await query('INSERT INTO notifications (id, owner_id, title, time_label, status, type, created_at) VALUES (?,?,?,?,?,?,?)',
    [nid, uid, 'Chào mừng bạn đến với English Center', 'Vừa xong', 'done', 'check', new Date().toISOString()]);

  res.json({ success: true });
});

export default router;
