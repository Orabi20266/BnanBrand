/* ==========================================================
   BnanBrand — طبقة قاعدة البيانات على Cloudflare D1
   (SQLite مجاني داخل Cloudflare — بديل الخادم المحلي)
   ========================================================== */

/* أدوات سطر أوامر D1: prepare(sql).bind(...).all() | .first() | .run() */
export async function all(env, sql, params = []) {
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return results || [];
}

export async function one(env, sql, params = []) {
  return await env.DB.prepare(sql).bind(...params).first();
}

export async function run(env, sql, params = []) {
  return await env.DB.prepare(sql).bind(...params).run();
}

/* الأقسام/المنتجات تخزن الحقول المتعددة كنص JSON (مطابق للخادم المحلي) */
export function parseJSON(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function toJSONText(value, fallback) {
  if (value == null) return JSON.stringify(fallback);
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return JSON.stringify(fallback);
    try {
      return JSON.stringify(JSON.parse(trimmed));
    } catch {
      return JSON.stringify(
        trimmed.split(',').map((s) => s.trim()).filter(Boolean)
      );
    }
  }
  return JSON.stringify(fallback);
}

export function slugify(text = '') {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function getSetting(env, key, fallback = '') {
  const row = await one(env, 'SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : fallback;
}

export async function getSettings(env) {
  const rows = await all(env, 'SELECT key, value FROM settings');
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function setSetting(env, key, value) {
  await run(
    env,
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, String(value ?? '')]
  );
}

export const DEFAULT_SETTINGS = {
  company_name: 'BnanBrand',
  company_email: 'info@bnanbrand.com',
  phone: '0590000000',
  whatsapp: '970590000000',
  address: 'فلسطين',
  currency: 'شيكل',
  shipping_fee: '15',
  free_shipping_threshold: '300',
  about_text:
    'BnanBrand منصة متخصصة في عرض وتسويق منتجات نسائية فاخرة تشمل الإكسسوارات وصناديق الهدايا والمزيد، بتصميم أنثوي راقٍ وتجربة تسوق سلسة وآمنة.',
};
