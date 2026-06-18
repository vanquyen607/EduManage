import { Router, Request, Response } from 'express';
import { query } from './db';
import { authMiddleware, hashPassword, verifyPassword, generateToken } from './auth';

const router = Router();

// ─── AUTH ────────────────────────────────────────────
router.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

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
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = await query('SELECT id, email, password, display_name, photo_url FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = result.rows[0];
    const valid = await verifyPassword(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = generateToken(user);
    res.json({ user: { id: user.id, email: user.email, displayName: user.display_name, photoURL: user.photo_url }, token });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/api/auth/me', authMiddleware, (req: any, res: Response) => {
  res.json({ user: req.user });
});

router.put('/api/auth/profile', authMiddleware, async (req: any, res: Response) => {
  try {
    const { displayName, email } = req.body;
    if (displayName) await query('UPDATE users SET display_name = $1 WHERE id = $2', [displayName, req.user.id]);
    if (email) {
      const existing = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
      if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already in use' });
      await query('UPDATE users SET email = $1 WHERE id = $2', [email, req.user.id]);
    }
    const result = await query('SELECT id, email, display_name, photo_url FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    res.json({ user: { id: user.id, email: user.email, displayName: user.display_name, photoURL: user.photo_url } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── STUDENTS ────────────────────────────────────────
router.get('/api/students', authMiddleware, async (req: any, res: Response) => {
  try {
    const result = await query('SELECT * FROM students WHERE owner_id = $1 ORDER BY name ASC', [req.user.id]);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/api/students', authMiddleware, async (req: any, res: Response) => {
  try {
    const { name, birthDate, gender, classId, parentName, parentPhone, parentEmail, email, phone, address, notes, status, joinDate } = req.body;
    const result = await query(
      `INSERT INTO students (owner_id, name, birth_date, gender, class_id, parent_name, parent_phone, parent_email, email, phone, address, notes, status, join_date, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [req.user.id, name, birthDate, gender, classId, parentName, parentPhone, parentEmail, email, phone, address, notes, status || 'active', joinDate, new Date().toISOString()]
    );
    const row = result.rows[0];
    res.json({ ...row, id: row.id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/api/students/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    const { name, birthDate, gender, classId, parentName, parentPhone, parentEmail, email, phone, address, notes, status, joinDate } = req.body;
    await query(
      `UPDATE students SET name=$1,birth_date=$2,gender=$3,class_id=$4,parent_name=$5,parent_phone=$6,parent_email=$7,email=$8,phone=$9,address=$10,notes=$11,status=$12,join_date=$13 WHERE id=$14 AND owner_id=$15`,
      [name, birthDate, gender, classId, parentName, parentPhone, parentEmail, email, phone, address, notes, status, joinDate, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/api/students/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    await query('DELETE FROM students WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── CLASSES ─────────────────────────────────────────
router.get('/api/classes', authMiddleware, async (req: any, res: Response) => {
  try {
    const result = await query('SELECT * FROM classes WHERE owner_id = $1 ORDER BY name ASC', [req.user.id]);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/api/classes', authMiddleware, async (req: any, res: Response) => {
  try {
    const { name, teacher, feePerSession, description, color, schedule } = req.body;
    const result = await query(
      `INSERT INTO classes (owner_id, name, teacher, fee_per_session, description, color, schedule)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, name, teacher, feePerSession, description, color || '#6366f1', JSON.stringify(schedule || [])]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/api/classes/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    const { name, teacher, feePerSession, description, color, schedule } = req.body;
    await query(
      `UPDATE classes SET name=$1, teacher=$2, fee_per_session=$3, description=$4, color=$5, schedule=$6 WHERE id=$7 AND owner_id=$8`,
      [name, teacher, feePerSession, description, color, JSON.stringify(schedule || []), req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/api/classes/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    await query('DELETE FROM classes WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GRADES ──────────────────────────────────────────
router.get('/api/grades', authMiddleware, async (req: any, res: Response) => {
  try {
    const result = await query('SELECT * FROM grades WHERE owner_id = $1 ORDER BY date DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/api/grades', authMiddleware, async (req: any, res: Response) => {
  try {
    const { studentId, classId, subject, score, weight, date, note } = req.body;
    const result = await query(
      `INSERT INTO grades (owner_id, student_id, class_id, subject, score, weight, date, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, studentId, classId, subject, score, weight, date, note]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/api/grades/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    const { studentId, classId, subject, score, weight, date, note } = req.body;
    await query(
      `UPDATE grades SET student_id=$1,class_id=$2,subject=$3,score=$4,weight=$5,date=$6,note=$7 WHERE id=$8 AND owner_id=$9`,
      [studentId, classId, subject, score, weight, date, note, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/api/grades/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    await query('DELETE FROM grades WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── ATTENDANCE ──────────────────────────────────────
router.get('/api/attendance', authMiddleware, async (req: any, res: Response) => {
  try {
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
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/api/attendance', authMiddleware, async (req: any, res: Response) => {
  try {
    const { studentId, classId, date, status, month, year } = req.body;
    const existing = await query(
      'SELECT id FROM attendance WHERE owner_id=$1 AND student_id=$2 AND date=$3',
      [req.user.id, studentId, date]
    );
    if (existing.rows.length > 0) {
      await query(
        'UPDATE attendance SET status=$1, class_id=$2, month=$3, year=$4 WHERE id=$5 AND owner_id=$6',
        [status, classId, month, year, existing.rows[0].id, req.user.id]
      );
      res.json({ id: existing.rows[0].id });
    } else {
      const result = await query(
        `INSERT INTO attendance (owner_id, student_id, class_id, date, status, month, year)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [req.user.id, studentId, classId, date, status, month, year]
      );
      res.json(result.rows[0]);
    }
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── INVOICES ────────────────────────────────────────
router.get('/api/invoices', authMiddleware, async (req: any, res: Response) => {
  try {
    const result = await query('SELECT * FROM invoices WHERE owner_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/api/invoices', authMiddleware, async (req: any, res: Response) => {
  try {
    const { studentId, month, year, sessionCount, totalAmount } = req.body;
    const result = await query(
      `INSERT INTO invoices (owner_id, student_id, month, year, session_count, total_amount, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, studentId, month, year, sessionCount, totalAmount, 'pending', new Date().toISOString()]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/api/invoices/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    const { status, paidAt } = req.body;
    const result = await query(
      'UPDATE invoices SET status=$1, paid_at=$2 WHERE id=$3 AND owner_id=$4 RETURNING *',
      [status, paidAt || new Date().toISOString(), req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/api/invoices/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    await query('DELETE FROM invoices WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── NOTIFICATIONS ───────────────────────────────────
router.get('/api/notifications', authMiddleware, async (req: any, res: Response) => {
  try {
    const result = await query('SELECT * FROM notifications WHERE owner_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/api/notifications', authMiddleware, async (req: any, res: Response) => {
  try {
    const { title, timeLabel, status, type } = req.body;
    const result = await query(
      `INSERT INTO notifications (owner_id, title, time_label, status, type, created_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, title, timeLabel, status, type, new Date().toISOString()]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/api/notifications/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    const { title, timeLabel, status, type } = req.body;
    await query(
      'UPDATE notifications SET title=$1, time_label=$2, status=$3, type=$4 WHERE id=$5 AND owner_id=$6',
      [title, timeLabel, status, type, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/api/notifications/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    await query('DELETE FROM notifications WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── COMMENTS ────────────────────────────────────────
router.get('/api/comments', authMiddleware, async (req: any, res: Response) => {
  try {
    const { studentId } = req.query;
    let sql = 'SELECT * FROM comments WHERE owner_id = $1';
    const params: any[] = [req.user.id];
    if (studentId) { sql += ' AND student_id = $2 ORDER BY created_at DESC'; params.push(studentId); }
    else { sql += ' ORDER BY created_at DESC'; }
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/api/comments', authMiddleware, async (req: any, res: Response) => {
  try {
    const { studentId, month, year, content, rating } = req.body;
    const result = await query(
      `INSERT INTO comments (owner_id, student_id, month, year, content, rating, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, studentId, month, year, content, rating, new Date().toISOString()]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── SETTINGS ────────────────────────────────────────
router.get('/api/settings', authMiddleware, async (req: any, res: Response) => {
  try {
    const result = await query('SELECT * FROM settings WHERE owner_id = $1', [req.user.id]);
    if (result.rows.length > 0) {
      const s = result.rows[0];
      res.json({ name: s.name, accountNumber: s.account_number, accountName: s.account_name, shortName: s.short_name });
    } else {
      res.json({ name: 'MB BANK', accountNumber: '123456789', accountName: 'NGUYEN VAN A', shortName: 'mbbank' });
    }
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/api/settings', authMiddleware, async (req: any, res: Response) => {
  try {
    const { name, accountNumber, accountName, shortName } = req.body;
    const existing = await query('SELECT id FROM settings WHERE owner_id = $1', [req.user.id]);
    if (existing.rows.length > 0) {
      await query(
        'UPDATE settings SET name=$1, account_number=$2, account_name=$3, short_name=$4 WHERE owner_id=$5',
        [name, accountNumber, accountName, shortName, req.user.id]
      );
    } else {
      await query(
        'INSERT INTO settings (owner_id, name, account_number, account_name, short_name) VALUES ($1,$2,$3,$4,$5)',
        [req.user.id, name, accountNumber, accountName, shortName]
      );
    }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── DEMO / UTILITY ──────────────────────────────────
router.post('/api/demo/clear', authMiddleware, async (req: any, res: Response) => {
  try {
    const tables = ['invoices', 'attendance', 'grades', 'comments', 'notifications', 'students', 'classes'];
    for (const t of tables) {
      await query(`DELETE FROM ${t} WHERE owner_id = $1`, [req.user.id]);
    }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/api/demo/seed', authMiddleware, async (req: any, res: Response) => {
  try {
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
        `INSERT INTO students (owner_id, name, class_id, parent_name, parent_phone, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [uid, s.name, ci, s.parentName, s.parentPhone, 'active', new Date().toISOString()]
      );
      studentIds.push(r.rows[0].id);
    }

    const subjects = ['Listening', 'Reading', 'Writing', 'Speaking'];
    for (let i = 0; i < studentIds.length; i++) {
      const ci = i < 2 ? classIds[0] : i === 2 ? classIds[1] : classIds[2];
      for (const subject of subjects) {
        await query(
          `INSERT INTO grades (owner_id, student_id, class_id, subject, score, weight, date)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [uid, studentIds[i], ci, subject, Math.floor(Math.random() * 5) + 5, 1, new Date().toISOString().split('T')[0]]
        );
      }
    }

    await query(
      `INSERT INTO notifications (owner_id, title, time_label, status, type, created_at)
       VALUES ($1,'Chào mừng bạn đến với English Center','Vừa xong','done','check',$2)`,
      [uid, new Date().toISOString()]
    );

    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
