/* ==========================================================
   BnanBrand — المصادقة على Cloudflare Workers
   - تخزين كلمة المرور: PBKDF2-SHA256 عبر WebCrypto (بدون مكتبات)
   - الجلسة: JWT بخوارزمية HS256 موقّع بـ HMAC عبر WebCrypto
   ========================================================== */
import { one } from './db.js';

const textEnc = new TextEncoder();
const textDec = new TextDecoder();

/* ---------- تحويل ثنائي إلى base64url والعكس ---------- */
function b64url(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(str) {
  let s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s + pad);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

const PBKDF2_ITERATIONS = 100000;

/* ---------- تجزئة كلمة المرور ---------- */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    textEnc.encode(String(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64url(salt)}$${b64url(new Uint8Array(bits))}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [alg, iters, saltB64, hashB64] = String(stored).split('$');
    if (alg !== 'pbkdf2') return false;
    const salt = fromB64url(saltB64);
    const key = await crypto.subtle.importKey(
      'raw',
      textEnc.encode(String(password)),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: Number(iters), hash: 'SHA-256' },
        key,
        256
      )
    );
    const expected = fromB64url(hashB64);
    if (bits.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}

/* ---------- JWT (HS256) ---------- */
function jwtSecret(env) {
  return env.JWT_SECRET || 'bnanbrand-dev-secret-change-me';
}

async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEnc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, textEnc.encode(data));
  return b64url(new Uint8Array(sig));
}

export async function signToken(env, user) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 أيام
  };
  const h = b64url(textEnc.encode(JSON.stringify(header)));
  const p = b64url(textEnc.encode(JSON.stringify(payload)));
  const body = `${h}.${p}`;
  const sig = await hmacSign(body, jwtSecret(env));
  return `${body}.${sig}`;
}

export async function verifyToken(env, token) {
  try {
    const [h, p, s] = String(token).split('.');
    if (!h || !p || !s) return null;
    const expected = await hmacSign(`${h}.${p}`, jwtSecret(env));
    if (expected !== s) return null;
    const payload = JSON.parse(textDec.decode(fromB64url(p)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ---------- قراءة المستخدم الحالي من رأس الطلب ---------- */
export async function authenticate(env, request) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return { user: null, error: { status: 401, message: 'يجب تسجيل الدخول للمتابعة.' } };

  const payload = await verifyToken(env, token);
  if (!payload) {
    return { user: null, error: { status: 401, message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.' } };
  }
  const user = await one(env, 'SELECT id, username, full_name, role FROM users WHERE id = ?', [payload.id]);
  if (!user) return { user: null, error: { status: 401, message: 'الحساب غير موجود.' } };
  return { user, error: null };
}

export async function requireAdmin(env, request) {
  const { user, error } = await authenticate(env, request);
  if (error) return { user: null, error };
  if (user.role !== 'admin') {
    return { user: null, error: { status: 403, message: 'هذه الإجراءات مخصصة للأدمن فقط.' } };
  }
  return { user, error: null };
}
