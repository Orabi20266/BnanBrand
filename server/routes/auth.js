import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, authenticate } from '../auth.js';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username).trim());
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' });
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role },
  });
});

authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

authRouter.put('/password', authenticate, (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'يرجى إدخال كلمة المرور الحالية والجديدة.' });
  }
  if (String(new_password).length < 6) {
    return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(String(current_password), user.password_hash)) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
  }

  const hash = bcrypt.hashSync(String(new_password), 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
  res.json({ ok: true, message: 'تم تحديث كلمة المرور بنجاح.' });
});
