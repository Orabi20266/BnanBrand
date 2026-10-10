import './env.js';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(here, 'data');
export const UPLOADS_DIR = path.join(here, 'uploads');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(DATA_DIR, 'bnanbrand.db');

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  category_id    INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  price          REAL NOT NULL DEFAULT 0,
  discount_price REAL,
  image          TEXT NOT NULL DEFAULT '',
  images         TEXT NOT NULL DEFAULT '[]',
  variants       TEXT NOT NULL DEFAULT '[]',
  stock          INTEGER NOT NULL DEFAULT 0,
  is_featured    INTEGER NOT NULL DEFAULT 0,
  is_active      INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number  TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL DEFAULT '',
  address       TEXT NOT NULL,
  notes         TEXT NOT NULL DEFAULT '',
  subtotal      REAL NOT NULL DEFAULT 0,
  discount      REAL NOT NULL DEFAULT 0,
  shipping      REAL NOT NULL DEFAULT 0,
  total         REAL NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'new',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant      TEXT NOT NULL DEFAULT '',
  unit_price   REAL NOT NULL DEFAULT 0,
  quantity     INTEGER NOT NULL DEFAULT 1,
  line_total   REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS email_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  recipient  TEXT,
  subject    TEXT,
  body       TEXT,
  type       TEXT,
  status     TEXT,
  error      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
`;

export function initSchema() {
  db.exec(SCHEMA);
}

/* ================= أدوات مساعدة ================= */

export function slugify(text = '') {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getSetting(key, fallback = '') {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

export function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export function setSetting(key, value) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, String(value ?? ''));
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

export function ensureDefaultSettings() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const exists = db.prepare('SELECT 1 FROM settings WHERE key = ?').get(key);
    if (!exists) setSetting(key, value);
  }
}
