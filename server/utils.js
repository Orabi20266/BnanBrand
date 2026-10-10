import { db, getSettings } from './db.js';

export function money(value, currency = '₪') {
  const n = Number(value || 0);
  return `${n.toFixed(2)} ${currency}`;
}

export function generateOrderNumber() {
  const d = new Date();
  const stamp =
    String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const num = `BN-${stamp}-${rand}`;
  const exists = db.prepare('SELECT 1 FROM orders WHERE order_number = ?').get(num);
  return exists ? generateOrderNumber() : num;
}

export function parseJSON(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function productToJSON(row) {
  if (!row) return null;
  return {
    ...row,
    images: parseJSON(row.images, []),
    variants: parseJSON(row.variants, []),
    in_stock: row.stock > 0,
    has_discount: row.discount_price != null && row.discount_price < row.price,
    is_featured: !!row.is_featured,
    is_active: !!row.is_active,
  };
}

export function orderWithItems(order) {
  if (!order) return null;
  const items = db
    .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id')
    .all(order.id);
  return { ...order, items };
}

export function settingsCurrency() {
  return getSettings().currency || '₪';
}

export function publicSettings() {
  const s = getSettings();
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
