import { Router } from 'express';
import { db, slugify } from '../db.js';
import { productToJSON } from '../utils.js';

function toJSONText(value, fallback) {
  if (value == null) return JSON.stringify(fallback);
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return JSON.stringify(fallback);
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed);
    } catch {
      return JSON.stringify(
        trimmed
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
  }
  return JSON.stringify(fallback);
}

function uniqueSlug(name, ignoreId = null) {
  const base = slugify(name) || 'product';
  let candidate = base;
  let i = 2;
  while (
    db.prepare('SELECT 1 FROM products WHERE slug = ? AND id <> ?').get(candidate, ignoreId ?? -1)
  ) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

/* ============ واجهة عامة ============ */
export const productsRouter = Router();

productsRouter.get('/', (req, res) => {
  const { search = '', category = '', featured = '', sort = 'newest', page = '1', limit = '12' } = req.query;

  const where = ['p.is_active = 1'];
  const params = [];

  if (search && String(search).trim()) {
    where.push('(p.name LIKE ? OR p.description LIKE ?)');
    const term = `%${String(search).trim()}%`;
    params.push(term, term);
  }

  if (category && String(category).trim()) {
    where.push('c.slug = ?');
    params.push(String(category).trim());
  }

  if (featured === '1' || featured === 'true') {
    where.push('p.is_featured = 1');
  }

  const orderBy =
    {
      newest: 'p.created_at DESC, p.id DESC',
      'price-asc': 'COALESCE(p.discount_price, p.price) ASC',
      'price-desc': 'COALESCE(p.discount_price, p.price) DESC',
      name: 'p.name ASC',
    }[String(sort)] || 'p.created_at DESC, p.id DESC';

  const perPage = Math.min(Math.max(Number(limit) || 12, 1), 60);
  const currentPage = Math.max(Number(page) || 1, 1);
  const offset = (currentPage - 1) * perPage;
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = db
    .prepare(
      `SELECT COUNT(*) AS c FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}`
    )
    .get(...params).c;

  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    )
    .all(...params, perPage, offset);

  res.json({
    items: rows.map(productToJSON),
    total,
    page: currentPage,
    pages: Math.max(Math.ceil(total / perPage), 1),
    limit: perPage,
  });
});

productsRouter.get('/:slug', (req, res) => {
  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_active = 1`
    )
    .get(req.params.slug);

  if (!row) return res.status(404).json({ error: 'المنتج غير موجود.' });

  const product = productToJSON(row);
  const related = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1 AND p.id <> ? AND (? IS NULL OR p.category_id = ?)
       ORDER BY RANDOM() LIMIT 4`
    )
    .all(product.id, product.category_id, product.category_id)
    .map(productToJSON);

  res.json({ product, related });
});

/* ============ إدارة (تتطلب مصادقة) ============ */
export const adminProductsRouter = Router();

adminProductsRouter.get('/', (req, res) => {
  const { search = '', category_id = '' } = req.query;
  const where = [];
  const params = [];
  if (search && String(search).trim()) {
    where.push('(p.name LIKE ? OR p.description LIKE ?)');
    const term = `%${String(search).trim()}%`;
    params.push(term, term);
  }
  if (category_id) {
    where.push('p.category_id = ?');
    params.push(Number(category_id));
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ORDER BY p.id DESC`
    )
    .all(...params);

  res.json({ items: rows.map(productToJSON) });
});

adminProductsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'المنتج غير موجود.' });
  res.json({ product: productToJSON(row) });
});

function readProductBody(body, existing = {}) {
  const name = body.name != null ? String(body.name).trim() : existing.name;
  const price = body.price != null ? Number(body.price) : existing.price;
  let discount = body.discount_price;
  if (discount === '' || discount === null || discount === undefined) discount = null;
  else discount = Number(discount);

  return {
    name,
    description: body.description != null ? String(body.description) : existing.description ?? '',
    category_id:
      body.category_id === '' || body.category_id == null
        ? null
        : Number(body.category_id),
    price: Number.isFinite(price) ? price : 0,
    discount_price: discount != null && Number.isFinite(discount) ? discount : null,
    image: body.image != null ? String(body.image) : existing.image ?? '',
    images: toJSONText(body.images, []),
    variants: toJSONText(body.variants, []),
    stock: body.stock != null ? Math.max(0, Number(body.stock) || 0) : existing.stock ?? 0,
    is_featured: body.is_featured ? 1 : 0,
    is_active: body.is_active === undefined ? existing.is_active ?? 1 : body.is_active ? 1 : 0,
  };
}

adminProductsRouter.post('/', (req, res) => {
  const data = readProductBody(req.body || {});
  if (!data.name) return res.status(400).json({ error: 'اسم المنتج مطلوب.' });
  if (!(data.price >= 0)) return res.status(400).json({ error: 'السعر غير صالح.' });

  const slug = uniqueSlug(req.body.slug || data.name);
  const info = db
    .prepare(
      `INSERT INTO products
        (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.name,
      slug,
      data.description,
      data.category_id,
      data.price,
      data.discount_price,
      data.image,
      data.images,
      data.variants,
      data.stock,
      data.is_featured,
      data.is_active
    );

  const created = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ product: productToJSON(created) });
});

adminProductsRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'المنتج غير موجود.' });

  const data = readProductBody(req.body || {}, existing);
  if (!data.name) return res.status(400).json({ error: 'اسم المنتج مطلوب.' });

  const slug =
    req.body.slug && slugify(req.body.slug) !== existing.slug
      ? uniqueSlug(req.body.slug, id)
      : existing.slug;

  db.prepare(
    `UPDATE products
     SET name = ?, slug = ?, description = ?, category_id = ?, price = ?, discount_price = ?,
         image = ?, images = ?, variants = ?, stock = ?, is_featured = ?, is_active = ?
     WHERE id = ?`
  ).run(
    data.name,
    slug,
    data.description,
    data.category_id,
    data.price,
    data.discount_price,
    data.image,
    data.images,
    data.variants,
    data.stock,
    data.is_featured,
    data.is_active,
    id
  );

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json({ product: productToJSON(updated) });
});

adminProductsRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'المنتج غير موجود.' });
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ ok: true });
});
