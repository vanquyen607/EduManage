import { Router, Request, Response } from 'express';
import { query } from './db';
import { authMiddleware, hashPassword, verifyPassword, generateToken } from './auth';
import { z } from 'zod';

const router = Router();

// ─── Validation helpers ──────────────────────────────
const emailSchema = z.string().email().max(255);
const passwordSchema = z.string().min(6).max(128);
const nameSchema = z.string().min(2).max(100);

function validate(schema: z.ZodType<any>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { ok: false as const, error: msg };
  }
  return { ok: true as const, data: result.data };
}

function requireAuth(handler: (req: any, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: any) => {
    authMiddleware(req, res, () => handler(req, res).catch(e => res.status(500).json({ error: e.message })));
  };
}

// ─── AUTH ────────────────────────────────────────────
router.post('/api/auth/register', async (req: Request, res: Response) => {
  const v = validate(z.object({ email: emailSchema, password: passwordSchema, displayName: z.string().min(2).max(100).optional() }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { email, password, displayName } = v.data;

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already exists' });

  const hashed = await hashPassword(password);
  const result = await query(
    'INSERT INTO users (email, password, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, photo_url, created_at',
    [email, hashed, displayName || null]
  );
  const user = result.rows[0];
  const token = generateToken(user);
  res.json({ user: { id: user.id, email: user.email, displayName: user.display_name, photoURL: user.photo_url }, token });
});

router.post('/api/auth/login', async (req: Request, res: Response) => {
  const v = validate(z.object({ email: emailSchema, password: passwordSchema }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { email, password } = v.data;

  const result = await query('SELECT id, email, password, display_name, photo_url FROM users WHERE email = $1', [email]);
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
  if (displayName) await query('UPDATE users SET display_name = $1 WHERE id = $2', [displayName, req.user.id]);
  if (email) {
    const existing = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already in use' });
    await query('UPDATE users SET email = $1 WHERE id = $2', [email, req.user.id]);
  }
  const result = await query('SELECT id, email, display_name, photo_url FROM users WHERE id = $1', [req.user.id]);
  const user = result.rows[0];
  res.json({ user: { id: user.id, email: user.email, displayName: user.display_name, photoURL: user.photo_url } });
});

// ─── STUDENTS ────────────────────────────────────────
router.get('/api/students', authMiddleware, async (req: any, res: Response) => {
  const result = await query('SELECT * FROM students WHERE owner_id = $1 ORDER BY name ASC', [req.user.id]);
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
  const result = await query(
    `INSERT INTO students (owner_id, name, birth_date, gender, class_id, parent_name, parent_phone, parent_email, email, phone, address, notes, status, join_date, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [req.user.id, name, birthDate, gender, classId, parentName, parentPhone, parentEmail, email, phone, address, notes, status || 'active', joinDate, new Date().toISOString()]
  );
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
  let i = 1;
  for (const [key, col] of Object.entries(colMap)) {
    if (fields[key] !== undefined) { sets.push(`${col}=$${i++}`); vals.push(fields[key]); }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  vals.push(req.params.id, req.user.id);
  await query(`UPDATE students SET ${sets.join(',')} WHERE id=$${i++} AND owner_id=$${i}`, vals);
  res.json({ success: true });
});

router.delete('/api/students/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM students WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── CLASSES ─────────────────────────────────────────
router.get('/api/classes', authMiddleware, async (req: any, res: Response) => {
  const result = await query('SELECT * FROM classes WHERE owner_id = $1 ORDER BY name ASC', [req.user.id]);
  res.json(result.rows);
});

router.post('/api/classes', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    name: nameSchema, teacher: z.string().max(100).optional(), feePerSession: z.number().min(0).max(100000000),
    description: z.string().max(500).optional(), color: z.string().optional(),
    schedule: z.array(z.object({ dayOfWeek: z.number().min(0).max(6), startTime: z.string(), endTime: z.string(), teacher: z.string().optional() })).optional(),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { name, teacher, feePerSession, description, color, schedule } = v.data;
  const result = await query(
    `INSERT INTO classes (owner_id, name, teacher, fee_per_session, description, color, schedule)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.id, name, teacher, feePerSession, description, color || '#6366f1', JSON.stringify(schedule || [])]
  );
  res.json(result.rows[0]);
});

router.put('/api/classes/:id', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    name: nameSchema.optional(), teacher: z.string().max(100).optional(), feePerSession: z.number().min(0).optional(),
    description: z.string().max(500).optional(), color: z.string().optional(),
    schedule: z.array(z.object({ dayOfWeek: z.number().min(0).max(6), startTime: z.string(), endTime: z.string(), teacher: z.string().optional() })).optional(),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { name, teacher, feePerSession, description, color, schedule } = v.data;
  await query(
    `UPDATE classes SET name=$1, teacher=$2, fee_per_session=$3, description=$4, color=$5, schedule=$6 WHERE id=$7 AND owner_id=$8`,
    [name, teacher, feePerSession, description, color, JSON.stringify(schedule || []), req.params.id, req.user.id]
  );
  res.json({ success: true });
});

router.delete('/api/classes/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM classes WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── GRADES ──────────────────────────────────────────
router.get('/api/grades', authMiddleware, async (req: any, res: Response) => {
  const result = await query('SELECT * FROM grades WHERE owner_id = $1 ORDER BY date DESC', [req.user.id]);
  res.json(result.rows);
});

router.post('/api/grades', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    studentId: z.string().min(1), classId: z.string().min(1), subject: z.string().min(1).max(100),
    score: z.number().min(0).max(10), weight: z.number().min(1).max(4), date: z.string().min(1), note: z.string().max(500).optional(),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { studentId, classId, subject, score, weight, date, note } = v.data;
  const result = await query(
    `INSERT INTO grades (owner_id, student_id, class_id, subject, score, weight, date, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.id, studentId, classId, subject, score, weight, date, note]
  );
  res.json(result.rows[0]);
});

router.put('/api/grades/:id', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    studentId: z.string().min(1).optional(), classId: z.string().min(1).optional(), subject: z.string().min(1).max(100).optional(),
    score: z.number().min(0).max(10).optional(), weight: z.number().min(1).max(4).optional(), date: z.string().min(1).optional(), note: z.string().max(500).optional(),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { studentId, classId, subject, score, weight, date, note } = v.data;
  await query(
    `UPDATE grades SET student_id=$1,class_id=$2,subject=$3,score=$4,weight=$5,date=$6,note=$7 WHERE id=$8 AND owner_id=$9`,
    [studentId, classId, subject, score, weight, date, note, req.params.id, req.user.id]
  );
  res.json({ success: true });
});

router.delete('/api/grades/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM grades WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── ATTENDANCE ──────────────────────────────────────
router.get('/api/attendance', authMiddleware, async (req: any, res: Response) => {
  const { classId, date, studentId, month, year } = req.query;
  let sql = 'SELECT * FROM attendance WHERE owner_id = $1';
  const params: any[] = [req.user.id];
  let idx = 2;
  if (classId) { sql += ` AND class_id = $${idx++}`; params.push(classId); }
  if (date) { sql += ` AND date = $${idx++}`; params.push(date); }
  if (studentId) { sql += ` AND student_id = $${idx++}`; params.push(studentId); }
  if (month) { sql += ` AND month = $${idx++}`; params.push(parseInt(month as string)); }
  if (year) { sql += ` AND year = $${idx++}`; params.push(parseInt(year as string)); }
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
  const existing = await query('SELECT id FROM attendance WHERE owner_id=$1 AND student_id=$2 AND date=$3', [req.user.id, studentId, date]);
  if (existing.rows.length > 0) {
    await query('UPDATE attendance SET status=$1, class_id=$2, month=$3, year=$4 WHERE id=$5 AND owner_id=$6',
      [status, classId, month, year, existing.rows[0].id, req.user.id]);
    res.json({ id: existing.rows[0].id });
  } else {
    const result = await query(
      `INSERT INTO attendance (owner_id, student_id, class_id, date, status, month, year) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, studentId, classId, date, status, month, year]);
    res.json(result.rows[0]);
  }
});

router.delete('/api/attendance/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM attendance WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── INVOICES ────────────────────────────────────────
router.get('/api/invoices', authMiddleware, async (req: any, res: Response) => {
  const result = await query('SELECT * FROM invoices WHERE owner_id = $1', [req.user.id]);
  res.json(result.rows);
});

router.post('/api/invoices', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({
    studentId: z.string().min(1), month: z.number().min(1).max(12), year: z.number().min(2020).max(2100),
    sessionCount: z.number().min(0), totalAmount: z.number().min(0),
  }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { studentId, month, year, sessionCount, totalAmount } = v.data;
  const result = await query(
    `INSERT INTO invoices (owner_id, student_id, month, year, session_count, total_amount, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.id, studentId, month, year, sessionCount, totalAmount, 'pending', new Date().toISOString()]
  );
  res.json(result.rows[0]);
});

router.put('/api/invoices/:id', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({ status: z.string().optional(), paidAt: z.string().optional() }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { status, paidAt } = v.data;
  const result = await query(
    'UPDATE invoices SET status=$1, paid_at=$2 WHERE id=$3 AND owner_id=$4 RETURNING *',
    [status || 'pending', paidAt || new Date().toISOString(), req.params.id, req.user.id]
  );
  res.json(result.rows[0]);
});

router.delete('/api/invoices/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM invoices WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── NOTIFICATIONS ───────────────────────────────────
router.get('/api/notifications', authMiddleware, async (req: any, res: Response) => {
  const result = await query('SELECT * FROM notifications WHERE owner_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json(result.rows);
});

router.post('/api/notifications', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({ title: z.string().min(2).max(200), timeLabel: z.string().min(1).max(100), status: z.string().min(1), type: z.string().min(1) }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { title, timeLabel, status, type } = v.data;
  const result = await query(
    `INSERT INTO notifications (owner_id, title, time_label, status, type, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, title, timeLabel, status, type, new Date().toISOString()]
  );
  res.json(result.rows[0]);
});

router.put('/api/notifications/:id', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({ title: z.string().min(2).max(200).optional(), timeLabel: z.string().min(1).max(100).optional(), status: z.string().min(1).optional(), type: z.string().min(1).optional() }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { title, timeLabel, status, type } = v.data;
  await query('UPDATE notifications SET title=$1, time_label=$2, status=$3, type=$4 WHERE id=$5 AND owner_id=$6',
    [title, timeLabel, status, type, req.params.id, req.user.id]);
  res.json({ success: true });
});

router.delete('/api/notifications/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM notifications WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── COMMENTS ────────────────────────────────────────
router.get('/api/comments', authMiddleware, async (req: any, res: Response) => {
  const { studentId } = req.query;
  let sql = 'SELECT * FROM comments WHERE owner_id = $1';
  const params: any[] = [req.user.id];
  if (studentId) { sql += ' AND student_id = $2 ORDER BY created_at DESC'; params.push(studentId); }
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
  const result = await query(
    `INSERT INTO comments (owner_id, student_id, month, year, content, rating, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.id, studentId, month, year, content, rating || 0, new Date().toISOString()]
  );
  res.json(result.rows[0]);
});

router.put('/api/comments/:id', authMiddleware, async (req: any, res: Response) => {
  const v = validate(z.object({ content: z.string().max(2000).optional(), rating: z.number().min(0).max(5).optional() }), req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { content, rating } = v.data;
  await query('UPDATE comments SET content=$1, rating=$2 WHERE id=$3 AND owner_id=$4', [content, rating, req.params.id, req.user.id]);
  res.json({ success: true });
});

router.delete('/api/comments/:id', authMiddleware, async (req: any, res: Response) => {
  await query('DELETE FROM comments WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── SETTINGS ────────────────────────────────────────
router.get('/api/settings', authMiddleware, async (req: any, res: Response) => {
  const result = await query('SELECT * FROM settings WHERE owner_id = $1', [req.user.id]);
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
  const existing = await query('SELECT id FROM settings WHERE owner_id = $1', [req.user.id]);
  if (existing.rows.length > 0) {
    await query('UPDATE settings SET name=$1, account_number=$2, account_name=$3, short_name=$4 WHERE owner_id=$5',
      [name, accountNumber, accountName, shortName, req.user.id]);
  } else {
    await query('INSERT INTO settings (owner_id, name, account_number, account_name, short_name) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, name, accountNumber, accountName, shortName]);
  }
  res.json({ success: true });
});

// ─── DEMO / UTILITY ──────────────────────────────────
router.post('/api/demo/clear', authMiddleware, async (req: any, res: Response) => {
  const tables = ['invoices', 'attendance', 'grades', 'comments', 'notifications', 'students', 'classes'];
  for (const t of tables) {
    await query(`DELETE FROM ${t} WHERE owner_id = $1`, [req.user.id]);
  }
  res.json({ success: true });
});

router.post('/api/demo/seed', authMiddleware, async (req: any, res: Response) => {
  const uid = req.user.id;
  const classResult = await query(
    `INSERT INTO classes (owner_id, name, color, teacher, fee_per_session, description, schedule) VALUES
     ($1,'IELTS Mastery','#6366f1','Thầy Trung',150000,'Lớp luyện thi IELTS chuyên sâu',$2),
     ($1,'English For Kids','#f59e0b','Cô Lan',120000,'Tiếng Anh thiếu nhi vui nhộn',$3),
     ($1,'Business English','#10b981','Thầy James',200000,'Tiếng Anh giao tiếp công việc',$4) RETURNING id`,
    [uid,
      JSON.stringify([{ dayOfWeek: 1, startTime: '18:00', endTime: '20:00' }, { dayOfWeek: 3, startTime: '18:00', endTime: '20:00' }]),
      JSON.stringify([{ dayOfWeek: 2, startTime: '17:00', endTime: '18:30' }, { dayOfWeek: 4, startTime: '17:00', endTime: '18:30' }]),
      JSON.stringify([{ dayOfWeek: 5, startTime: '19:00', endTime: '21:00' }])
    ]
  );
  const classIds = classResult.rows.map(r => r.id);

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
    const r = await query(
      `INSERT INTO students (owner_id, name, class_id, parent_name, parent_phone, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [uid, s.name, ci, s.parentName, s.parentPhone, 'active', new Date().toISOString()]
    );
    studentIds.push(r.rows[0].id);
  }

  const subjects = ['Listening', 'Reading', 'Writing', 'Speaking'];
  for (let i = 0; i < studentIds.length; i++) {
    const ci = i < 2 ? classIds[0] : i === 2 ? classIds[1] : classIds[2];
    for (const subject of subjects) {
      await query(`INSERT INTO grades (owner_id, student_id, class_id, subject, score, weight, date) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [uid, studentIds[i], ci, subject, Math.floor(Math.random() * 5) + 5, 1, new Date().toISOString().split('T')[0]]);
    }
  }

  await query(`INSERT INTO notifications (owner_id, title, time_label, status, type, created_at) VALUES ($1,'Chào mừng bạn đến với English Center','Vừa xong','done','check',$2)`,
    [uid, new Date().toISOString()]);

  res.json({ success: true });
});

export default router;
