import jwt from 'jsonwebtoken';
import { env } from './env.js';
import { db } from './db.js';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

/** Middleware: يتحقق من صلاحية توكن الأدمن */
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول للمتابعة.' });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = db
      .prepare('SELECT id, username, full_name, role FROM users WHERE id = ?')
      .get(payload.id);

    if (!user) {
      return res.status(401).json({ error: 'الحساب غير موجود.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.' });
  }
}
