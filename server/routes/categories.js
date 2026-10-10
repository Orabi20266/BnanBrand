import { Router } from 'express';
import { db, slugify } from '../db.js';

/* ============ واجهة عامة ============ */
export const categoriesRouter = Router();

categoriesRouter.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, (
         SELECT COUNT(*) FROM products p
         WHERE p.category_id = c.id AND p.is_active = 1
       ) AS product_count
       FROM categories c
       WHERE c.is_active = 1
       ORDER BY c.sort_order ASC, c.id ASC`
    )
    .all();
  res.json({ items: rows.map((r) => ({ ...r, is_active: !!r.is_active })) });
});

categoriesRouter.get('/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM categories WHERE slug = ? AND is_active = 1').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'القسم غير موجود.' });
  res.json({ category: { ...row, is_active: !!row.is_active } });
});

/* ============ إدارة (تتطلب مصادقة) ============ */
export const adminCategoriesRouter = Router();

function uniqueSlug(name, ignoreId = null) {
  let base = slugify(name) || 'category';
  let candidate = base;
  let i = 2;
  while (
    db
      .prepare('SELECT 1 FROM categories WHERE slug = ? AND id <> ?')
      .get(candidate, ignoreId ?? -1)
  ) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

adminCategoriesRouter.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, (
         SELECT COUNT(*) FROM products p WHERE p.category_id = c.id
       ) AS product_count
       FROM categories c
       ORDER BY c.sort_order ASC, c.id ASC`
    )
    .all();
  res.json({ items: rows.map((r) => ({ ...r, is_active: !!r.is_active })) });
});

adminCategoriesRouter.post('/', (req, res) => {
  const { name, slug, description = '', image = '', sort_order = 0, is_active = 1 } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'اسم القسم مطلوب.' });
  }
  const finalSlug = slug && String(slug).trim() ? uniqueSlug(slug) : uniqueSlug(name);
  const info = db
    .prepare(
      `INSERT INTO categories (name, slug, description, image, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(String(name).trim(), finalSlug, String(description), String(image), Number(sort_order) || 0, is_active ? 1 : 0);

  const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ category: { ...created, is_active: !!created.is_active } });
});

adminCategoriesRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'القسم غير موجود.' });

  const {
    name = existing.name,
    slug = existing.slug,
    description = existing.description,
    image = existing.image,
    sort_order = existing.sort_order,
    is_active = existing.is_active,
  } = req.body || {};

  const finalSlug =
    String(slug).trim() && slugify(slug) !== existing.slug ? uniqueSlug(slug, id) : existing.slug;

  db.prepare(
    `UPDATE categories
     SET name = ?, slug = ?, description = ?, image = ?, sort_order = ?, is_active = ?
     WHERE id = ?`
  ).run(
    String(name).trim(),
    finalSlug,
    String(description),
    String(image),
    Number(sort_order) || 0,
    is_active ? 1 : 0,
    id
  );

  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json({ category: { ...updated, is_active: !!updated.is_active } });
});

adminCategoriesRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'القسم غير موجود.' });
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ ok: true });
});
