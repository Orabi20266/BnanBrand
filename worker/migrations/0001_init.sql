-- ============================================================
--   مخطط قاعدة بيانات BnanBrand على Cloudflare D1
--   (مطابق لمخطط الخادم المحلي + جدول الصور)
-- ============================================================

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

-- صور يرفعها الأدمن من لوحة التحكم (مخزّنة كـ base64 داخل قاعدة البيانات)
CREATE TABLE IF NOT EXISTS images (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  filename     TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'image/jpeg',
  data         TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
