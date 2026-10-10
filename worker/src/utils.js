/* ==========================================================
   BnanBrand — أدوات مساعدة (مطابقة للخادم المحلي)
   ========================================================== */
import { all, one, parseJSON, getSettings } from './db.js';

export function money(value, currency = '₪') {
  return `${Number(value || 0).toFixed(2)} ${currency}`;
}

export async function generateOrderNumber(env) {
  const d = new Date();
  const stamp =
    String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const num = `BN-${stamp}-${rand}`;
  const exists = await one(env, 'SELECT 1 AS x FROM orders WHERE order_number = ?', [num]);
  return exists ? generateOrderNumber(env) : num;
}

/* تحويل مسار الصورة النسبي إلى رابط مطلق حتى تظهر من خارج الموقع (GitHub Pages / لوحة التحكم) */
function absoluteImage(image, origin) {
  if (!image) return '';
  const value = String(image);
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;
  if (value.startsWith('/')) return origin + value;
  return value;
}

export function productToJSON(row, origin = '') {
  if (!row) return null;
  return {
    ...row,
    image: absoluteImage(row.image, origin),
    images: parseJSON(row.images, []).map((i) => absoluteImage(i, origin)),
    variants: parseJSON(row.variants, []),
    in_stock: row.stock > 0,
    has_discount: row.discount_price != null && row.discount_price < row.price,
    is_featured: !!row.is_featured,
    is_active: !!row.is_active,
  };
}

export async function orderWithItems(env, order) {
  if (!order) return null;
  const items = await all(env, 'SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [order.id]);
  return { ...order, items };
}

export async function publicSettings(env) {
  const s = await getSettings(env);
  return {
    company_name: s.company_name || 'BnanBrand',
    company_email: s.company_email || '',
    phone: s.phone || '',
    whatsapp: s.whatsapp || '',
    address: s.address || '',
    currency: s.currency || '₪',
    shipping_fee: Number(s.shipping_fee || 0),
    free_shipping_threshold: Number(s.free_shipping_threshold || 0),
    about_text: s.about_text || '',
  };
}
