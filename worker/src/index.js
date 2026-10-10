/* ==========================================================
   BnanBrand API — Cloudflare Worker
   يعيد بناء كل واجهات الخادم المحلي (Express) على الحافة مجاناً
   ========================================================== */
import { all, one, run, slugify, toJSONText, getSettings, setSetting, DEFAULT_SETTINGS } from './db.js';
import { hashPassword, verifyPassword, signToken, authenticate, requireAdmin } from './auth.js';
import { productToJSON, orderWithItems, publicSettings, generateOrderNumber } from './utils.js';
import { SEED_IMAGES } from './seed-images.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const VALID_STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  });
}
function err(status, message) {
  return json({ error: message }, status);
}
async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = url.origin;
    const method = request.method.toUpperCase();

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    try {
      const res = await route(request, env, url, path, origin, method);
      if (res) {
        // ضمان وجود رؤوس CORS في كل الردود
        for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
        return res;
      }
      return err(404, 'المسار غير موجود.');
    } catch (e) {
      return err(500, 'خطأ في الخادم: ' + (e && e.message ? e.message : 'غير معروف'));
    }
  },
};

async function route(request, env, url, path, origin, method) {
  /* ============ الصحة ============ */
  if (path === '/api/health' && method === 'GET') {
    return json({ ok: true, name: 'BnanBrand API' });
  }

  /* ============ المصادقة ============ */
  if (path === '/api/auth/login' && method === 'POST') return authLogin(request, env);
  if (path === '/api/auth/register' && method === 'POST') return authRegister(request, env);
  if (path === '/api/auth/me' && method === 'GET') return authMe(request, env);
  if (path === '/api/auth/password' && method === 'PUT') return authPassword(request, env);

  /* ============ الإعدادات العامة ============ */
  if (path === '/api/settings' && method === 'GET') {
    return json({ settings: await publicSettings(env) });
  }

  /* ============ الأقسام ============ */
  if (path === '/api/categories' && method === 'GET') return categoriesList(env);
  if (path.startsWith('/api/categories/') && method === 'GET') {
    return categoryBySlug(env, decodeURIComponent(path.slice('/api/categories/'.length)));
  }

  /* ============ المنتجات ============ */
  if (path === '/api/products' && method === 'GET') return productsList(env, url, origin);
  if (path.startsWith('/api/products/') && method === 'GET') {
    return productBySlug(env, origin, decodeURIComponent(path.slice('/api/products/'.length)));
  }

  /* ============ الطلبات ============ */
  if (path === '/api/orders' && method === 'POST') return createOrder(request, env);
  if (path.startsWith('/api/orders/track/') && method === 'GET') {
    return trackOrder(env, decodeURIComponent(path.slice('/api/orders/track/'.length)));
  }

  /* ============ الإدارة (محمية) ============ */
  if (path.startsWith('/api/admin/')) return adminRoute(request, env, path, origin, method);

  /* ============ الأصول (الصور) ============ */
  if (path.startsWith('/api/assets/') && method === 'GET') {
    return serveAsset(env, path.slice('/api/assets/'.length));
  }
  if (path.startsWith('/uploads/') && method === 'GET') {
    return serveSeedImage(path.slice('/uploads/'.length));
  }

  return null;
}

/* ==================================================================
   المصادقة
   ================================================================== */
async function authLogin(request, env) {
  const { username, password } = await readBody(request);
  if (!username || !password) return err(400, 'يرجى إدخال اسم المستخدم وكلمة المرور.');

  const user = await one(env, 'SELECT * FROM users WHERE username = ?', [String(username).trim()]);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return err(401, 'بيانات الدخول غير صحيحة.');
  }
  const token = await signToken(env, user);
  return json({
    token,
    user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role },
  });
}

async function authRegister(request, env) {
  const { name = '', username, password } = await readBody(request);
  const email = String(username || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return err(400, 'يرجى إدخال بريد إلكتروني صحيح.');
  }
  if (!password || String(password).length < 6) {
    return err(400, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
  }
  const exists = await one(env, 'SELECT 1 AS x FROM users WHERE username = ?', [email]);
  if (exists) return err(409, 'هذا البريد مسجّل مسبقاً — سجّلي الدخول مباشرة.');

  const hash = await hashPassword(password);
  const info = await run(
    env,
    "INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, 'customer')",
    [email, hash, String(name).trim()]
  );
  const user = await one(env, 'SELECT * FROM users WHERE id = ?', [info.meta.last_row_id]);
  const token = await signToken(env, user);
  return json(
    {
      token,
      user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role },
    },
    201
  );
}

async function authMe(request, env) {
  const { user, error } = await authenticate(env, request);
  if (error) return err(error.status, error.message);
  return json({ user });
}

async function authPassword(request, env) {
  const { user, error } = await authenticate(env, request);
  if (error) return err(error.status, error.message);

  const { current_password, new_password } = await readBody(request);
  if (!current_password || !new_password) return err(400, 'يرجى إدخال كلمة المرور الحالية والجديدة.');
  if (String(new_password).length < 6) return err(400, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');

  const full = await one(env, 'SELECT * FROM users WHERE id = ?', [user.id]);
  if (!(await verifyPassword(current_password, full.password_hash))) {
    return err(400, 'كلمة المرور الحالية غير صحيحة.');
  }
  const hash = await hashPassword(new_password);
  await run(env, 'UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
  return json({ ok: true, message: 'تم تحديث كلمة المرور بنجاح.' });
}

/* ==================================================================
   الأقسام
   ================================================================== */
async function categoriesList(env) {
  const rows = await all(
    env,
    `SELECT c.*, (
       SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1
     ) AS product_count
     FROM categories c
     WHERE c.is_active = 1
     ORDER BY c.sort_order ASC, c.id ASC`
  );
  return json({ items: rows.map((r) => ({ ...r, is_active: !!r.is_active })) });
}

async function categoryBySlug(env, slug) {
  const row = await one(env, 'SELECT * FROM categories WHERE slug = ? AND is_active = 1', [slug]);
  if (!row) return err(404, 'القسم غير موجود.');
  return json({ category: { ...row, is_active: !!row.is_active } });
}

/* ==================================================================
   المنتجات (عامة)
   ================================================================== */
async function productsList(env, url, origin) {
  const { search = '', category = '', featured = '', sort = 'newest', page = '1', limit = '12' } = Object.fromEntries(url.searchParams);

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
  if (featured === '1' || featured === 'true') where.push('p.is_featured = 1');

  const orderBy =
    {
      newest: 'p.created_at DESC, p.id DESC',
      'price-asc': 'COALESCE(p.discount_price, p.price) ASC',
      'price-desc': 'COALESCE(p.discount_price, p.price) DESC',
      name: 'p.name ASC',
    }[String(sort)] || 'p.created_at DESC, p.id DESC';

  const perPage = Math.min(Math.max(Number(limit) || 12, 1), 120);
  const currentPage = Math.max(Number(page) || 1, 1);
  const offset = (currentPage - 1) * perPage;
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const totalRow = await one(
    env,
    `SELECT COUNT(*) AS c FROM products p LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`,
    params
  );
  const total = totalRow ? totalRow.c : 0;

  const rows = await all(
    env,
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, perPage, offset]
  );

  return json({
    items: rows.map((r) => productToJSON(r, origin)),
    total,
    page: currentPage,
    pages: Math.max(Math.ceil(total / perPage), 1),
    limit: perPage,
  });
}

async function productBySlug(env, origin, slug) {
  const row = await one(
    env,
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.slug = ? AND p.is_active = 1`,
    [slug]
  );
  if (!row) return err(404, 'المنتج غير موجود.');

  const product = productToJSON(row, origin);
  const related = await all(
    env,
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = 1 AND p.id <> ? AND (? IS NULL OR p.category_id = ?)
     ORDER BY RANDOM() LIMIT 4`,
    [product.id, product.category_id, product.category_id]
  );
  return json({ product, related: related.map((r) => productToJSON(r, origin)) });
}

/* ==================================================================
   الطلبات (عامة)
   ================================================================== */
async function createOrder(request, env) {
  const { customer_name, phone, email = '', address, notes = '', items } = await readBody(request);
  if (!customer_name || !phone || !address) {
    return err(400, 'الاسم ورقم الهاتف وعنوان التوصيل حقول مطلوبة.');
  }
  if (!Array.isArray(items) || items.length === 0) return err(400, 'سلة الطلب فارغة.');

  let subtotal = 0;
  const resolved = [];
  for (const raw of items) {
    const product = await one(env, 'SELECT * FROM products WHERE id = ?', [Number(raw.product_id)]);
    if (!product || !product.is_active) continue;
    const p = productToJSON(product, '');
    const quantity = Math.max(1, Number(raw.quantity) || 1);
    const unitPrice = p.has_discount ? p.discount_price : p.price;
    const lineTotal = unitPrice * quantity;
    subtotal += lineTotal;
    resolved.push({
      product_id: p.id,
      product_name: p.name,
      variant: raw.variant ? String(raw.variant) : '',
      unit_price: unitPrice,
      quantity,
      line_total: lineTotal,
    });
  }
  if (resolved.length === 0) return err(400, 'لا توجد منتجات صالحة في الطلب.');

  const shippingFee = Number(await getSettingStr(env, 'shipping_fee', '0')) || 0;
  const freeThreshold = Number(await getSettingStr(env, 'free_shipping_threshold', '0')) || 0;
  const shipping = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : shippingFee;
  const discount = 0;
  const total = subtotal - discount + shipping;
  const orderNumber = await generateOrderNumber(env);

  const info = await run(
    env,
    `INSERT INTO orders
      (order_number, customer_name, phone, email, address, notes, subtotal, discount, shipping, total, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
    [
      orderNumber,
      String(customer_name).trim(),
      String(phone).trim(),
      String(email).trim(),
      String(address).trim(),
      String(notes).trim(),
      subtotal,
      discount,
      shipping,
      total,
    ]
  );
  const orderId = info.meta.last_row_id;

  for (const it of resolved) {
    await run(
      env,
      `INSERT INTO order_items (order_id, product_id, product_name, variant, unit_price, quantity, line_total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, it.product_id, it.product_name, it.variant, it.unit_price, it.quantity, it.line_total]
    );
  }

  const order = await one(env, 'SELECT * FROM orders WHERE id = ?', [orderId]);
  return json({ order: await orderWithItems(env, order) }, 201);
}

async function trackOrder(env, orderNumber) {
  const order = await one(env, 'SELECT * FROM orders WHERE order_number = ?', [String(orderNumber).trim()]);
  if (!order) return err(404, 'لم يتم العثور على طلب بهذا الرقم.');
  return json({ order: await orderWithItems(env, order) });
}

async function getSettingStr(env, key, fallback = '') {
  const row = await one(env, 'SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : fallback;
}

/* ==================================================================
   الإدارة (محمية)
   ================================================================== */
async function adminRoute(request, env, path, origin, method) {
  const { user, error } = await requireAdmin(env, request);
  if (error) return err(error.status, error.message);

  /* ---- المنتجات ---- */
  if (path === '/api/admin/products' && method === 'GET') return adminProductsList(env, url0(request), origin);
  if (path === '/api/admin/products' && method === 'POST') return adminProductCreate(request, env, origin);
  if (path.startsWith('/api/admin/products/') && method === 'GET') {
    return adminProductGet(env, origin, path.slice('/api/admin/products/'.length));
  }
  if (path.startsWith('/api/admin/products/') && method === 'PUT') {
    return adminProductUpdate(request, env, origin, path.slice('/api/admin/products/'.length));
  }
  if (path.startsWith('/api/admin/products/') && method === 'DELETE') {
    return adminProductDelete(env, path.slice('/api/admin/products/'.length));
  }

  /* ---- الأقسام ---- */
  if (path === '/api/admin/categories' && method === 'GET') return adminCategoriesList(env);
  if (path === '/api/admin/categories' && method === 'POST') return adminCategoryCreate(request, env);
  if (path.startsWith('/api/admin/categories/') && method === 'PUT') {
    return adminCategoryUpdate(request, env, path.slice('/api/admin/categories/'.length));
  }
  if (path.startsWith('/api/admin/categories/') && method === 'DELETE') {
    return adminCategoryDelete(env, path.slice('/api/admin/categories/'.length));
  }

  /* ---- الطلبات ---- */
  if (path === '/api/admin/orders' && method === 'GET') return adminOrdersList(env, url0(request));
  if (path.startsWith('/api/admin/orders/') && path.endsWith('/status') && method === 'PUT') {
    return adminOrderStatus(request, env, path.slice('/api/admin/orders/'.length, -'/status'.length));
  }
  if (path.startsWith('/api/admin/orders/') && method === 'GET') {
    return adminOrderGet(env, path.slice('/api/admin/orders/'.length));
  }
  if (path.startsWith('/api/admin/orders/') && method === 'DELETE') {
    return adminOrderDelete(env, path.slice('/api/admin/orders/'.length));
  }

  /* ---- الإعدادات ---- */
  if (path === '/api/admin/settings' && method === 'GET') return adminSettingsGet(env);
  if (path === '/api/admin/settings' && method === 'PUT') return adminSettingsUpdate(request, env);

  /* ---- الإحصائيات ---- */
  if (path === '/api/admin/stats' && method === 'GET') return adminStats(env);

  /* ---- رفع الصور ---- */
  if (path === '/api/admin/uploads' && method === 'POST') return adminUpload(request, env, origin);
  if (path.startsWith('/api/admin/uploads/') && method === 'DELETE') {
    return adminUploadDelete(env, path.slice('/api/admin/uploads/'.length));
  }

  return err(404, 'المسار الإداري غير موجود.');
}

/* url0: نحتاج كائن URL داخل الدوال الإدارية؛ نستخرجه من الطلب */
function url0(request) {
  return new URL(request.url);
}

/* ---- أدوات المنتجات ---- */
function readProductBody(body, existing = {}) {
  const name = body.name != null ? String(body.name).trim() : existing.name;
  const price = body.price != null ? Number(body.price) : existing.price;
  let discount = body.discount_price;
  if (discount === '' || discount === null || discount === undefined) discount = null;
  else discount = Number(discount);

  return {
    name,
    description: body.description != null ? String(body.description) : existing.description ?? '',
    category_id: body.category_id === '' || body.category_id == null ? null : Number(body.category_id),
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

async function uniqueProductSlug(env, name, ignoreId = null) {
  const base = slugify(name) || 'product';
  let candidate = base;
  let i = 2;
  while (await one(env, 'SELECT 1 AS x FROM products WHERE slug = ? AND id <> ?', [candidate, ignoreId ?? -1])) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

async function adminProductsList(env, url, origin) {
  const { search = '', category_id = '' } = Object.fromEntries(url.searchParams);
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
  const rows = await all(
    env,
    `SELECT p.*, c.name AS category_name FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ${whereSql} ORDER BY p.id DESC`,
    params
  );
  return json({ items: rows.map((r) => productToJSON(r, origin)) });
}

async function adminProductGet(env, origin, id) {
  const row = await one(env, 'SELECT * FROM products WHERE id = ?', [Number(id)]);
  if (!row) return err(404, 'المنتج غير موجود.');
  return json({ product: productToJSON(row, origin) });
}

async function adminProductCreate(request, env, origin) {
  const body = await readBody(request);
  const data = readProductBody(body);
  if (!data.name) return err(400, 'اسم المنتج مطلوب.');
  if (!(data.price >= 0)) return err(400, 'السعر غير صالح.');

  const slug = await uniqueProductSlug(env, body.slug || data.name);
  const info = await run(
    env,
    `INSERT INTO products
      (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.name, slug, data.description, data.category_id, data.price, data.discount_price, data.image, data.images, data.variants, data.stock, data.is_featured, data.is_active]
  );
  const created = await one(env, 'SELECT * FROM products WHERE id = ?', [info.meta.last_row_id]);
  return json({ product: productToJSON(created, origin) }, 201);
}

async function adminProductUpdate(request, env, origin, idStr) {
  const id = Number(idStr);
  const existing = await one(env, 'SELECT * FROM products WHERE id = ?', [id]);
  if (!existing) return err(404, 'المنتج غير موجود.');
  const body = await readBody(request);
  const data = readProductBody(body, existing);
  if (!data.name) return err(400, 'اسم المنتج مطلوب.');

  const slug =
    body.slug && slugify(body.slug) !== existing.slug
      ? await uniqueProductSlug(env, body.slug, id)
      : existing.slug;

  await run(
    env,
    `UPDATE products
     SET name = ?, slug = ?, description = ?, category_id = ?, price = ?, discount_price = ?,
         image = ?, images = ?, variants = ?, stock = ?, is_featured = ?, is_active = ?
     WHERE id = ?`,
    [data.name, slug, data.description, data.category_id, data.price, data.discount_price, data.image, data.images, data.variants, data.stock, data.is_featured, data.is_active, id]
  );
  const updated = await one(env, 'SELECT * FROM products WHERE id = ?', [id]);
  return json({ product: productToJSON(updated, origin) });
}

async function adminProductDelete(env, idStr) {
  const id = Number(idStr);
  const existing = await one(env, 'SELECT 1 AS x FROM products WHERE id = ?', [id]);
  if (!existing) return err(404, 'المنتج غير موجود.');
  await run(env, 'DELETE FROM products WHERE id = ?', [id]);
  return json({ ok: true });
}

/* ---- أدوات الأقسام ---- */
async function uniqueCategorySlug(env, name, ignoreId = null) {
  const base = slugify(name) || 'category';
  let candidate = base;
  let i = 2;
  while (await one(env, 'SELECT 1 AS x FROM categories WHERE slug = ? AND id <> ?', [candidate, ignoreId ?? -1])) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

async function adminCategoriesList(env) {
  const rows = await all(
    env,
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
     FROM categories c ORDER BY c.sort_order ASC, c.id ASC`
  );
  return json({ items: rows.map((r) => ({ ...r, is_active: !!r.is_active })) });
}

async function adminCategoryCreate(request, env) {
  const { name, slug, description = '', image = '', sort_order = 0, is_active = 1 } = await readBody(request);
  if (!name || !String(name).trim()) return err(400, 'اسم القسم مطلوب.');
  const finalSlug = slug && String(slug).trim() ? await uniqueCategorySlug(env, slug) : await uniqueCategorySlug(env, name);
  const info = await run(
    env,
    `INSERT INTO categories (name, slug, description, image, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
    [String(name).trim(), finalSlug, String(description), String(image), Number(sort_order) || 0, is_active ? 1 : 0]
  );
  const created = await one(env, 'SELECT * FROM categories WHERE id = ?', [info.meta.last_row_id]);
  return json({ category: { ...created, is_active: !!created.is_active } }, 201);
}

async function adminCategoryUpdate(request, env, idStr) {
  const id = Number(idStr);
  const existing = await one(env, 'SELECT * FROM categories WHERE id = ?', [id]);
  if (!existing) return err(404, 'القسم غير موجود.');
  const {
    name = existing.name,
    slug = existing.slug,
    description = existing.description,
    image = existing.image,
    sort_order = existing.sort_order,
    is_active = existing.is_active,
  } = await readBody(request);

  const finalSlug =
    String(slug).trim() && slugify(slug) !== existing.slug
      ? await uniqueCategorySlug(env, slug, id)
      : existing.slug;

  await run(
    env,
    `UPDATE categories SET name = ?, slug = ?, description = ?, image = ?, sort_order = ?, is_active = ? WHERE id = ?`,
    [String(name).trim(), finalSlug, String(description), String(image), Number(sort_order) || 0, is_active ? 1 : 0, id]
  );
  const updated = await one(env, 'SELECT * FROM categories WHERE id = ?', [id]);
  return json({ category: { ...updated, is_active: !!updated.is_active } });
}

async function adminCategoryDelete(env, idStr) {
  const id = Number(idStr);
  const existing = await one(env, 'SELECT 1 AS x FROM categories WHERE id = ?', [id]);
  if (!existing) return err(404, 'القسم غير موجود.');
  await run(env, 'DELETE FROM categories WHERE id = ?', [id]);
  return json({ ok: true });
}

/* ---- الطلبات ---- */
async function adminOrdersList(env, url) {
  const { status = '', search = '' } = Object.fromEntries(url.searchParams);
  const where = [];
  const params = [];
  if (status) {
    where.push('o.status = ?');
    params.push(String(status));
  }
  if (search && String(search).trim()) {
    where.push('(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.phone LIKE ?)');
    const term = `%${String(search).trim()}%`;
    params.push(term, term, term);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await all(
    env,
    `SELECT o.*, (SELECT SUM(quantity) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
     FROM orders o ${whereSql} ORDER BY o.created_at DESC, o.id DESC`,
    params
  );
  return json({ items: rows });
}

async function adminOrderGet(env, idStr) {
  const order = await one(env, 'SELECT * FROM orders WHERE id = ?', [Number(idStr)]);
  if (!order) return err(404, 'الطلب غير موجود.');
  return json({ order: await orderWithItems(env, order) });
}

async function adminOrderStatus(request, env, idStr) {
  const id = Number(idStr);
  const { status } = await readBody(request);
  if (!VALID_STATUSES.includes(status)) return err(400, 'حالة الطلب غير صالحة.');
  const existing = await one(env, 'SELECT 1 AS x FROM orders WHERE id = ?', [id]);
  if (!existing) return err(404, 'الطلب غير موجود.');
  await run(env, 'UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  const order = await one(env, 'SELECT * FROM orders WHERE id = ?', [id]);
  return json({ order: await orderWithItems(env, order) });
}

async function adminOrderDelete(env, idStr) {
  const id = Number(idStr);
  const existing = await one(env, 'SELECT 1 AS x FROM orders WHERE id = ?', [id]);
  if (!existing) return err(404, 'الطلب غير موجود.');
  await run(env, 'DELETE FROM order_items WHERE order_id = ?', [id]);
  await run(env, 'DELETE FROM orders WHERE id = ?', [id]);
  return json({ ok: true });
}

/* ---- الإعدادات ---- */
async function adminSettingsGet(env) {
  return json({ settings: { ...DEFAULT_SETTINGS, ...(await getSettings(env)) } });
}

async function adminSettingsUpdate(request, env) {
  const body = await readBody(request);
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (key in body) await setSetting(env, key, body[key]);
  }
  return json({ settings: { ...DEFAULT_SETTINGS, ...(await getSettings(env)) } });
}

/* ---- الإحصائيات ---- */
async function adminStats(env) {
  const products = (await one(env, 'SELECT COUNT(*) AS c FROM products WHERE is_active = 1')).c;
  const categories = (await one(env, 'SELECT COUNT(*) AS c FROM categories WHERE is_active = 1')).c;
  const orders = (await one(env, 'SELECT COUNT(*) AS c FROM orders')).c;
  const newOrders = (await one(env, "SELECT COUNT(*) AS c FROM orders WHERE status = 'new'")).c;
  const revenue = (await one(env, "SELECT COALESCE(SUM(total), 0) AS s FROM orders WHERE status <> 'cancelled'")).s;
  const customers = (await one(env, 'SELECT COUNT(DISTINCT phone) AS c FROM orders')).c;

  const recentOrders = await all(
    env,
    `SELECT o.*, (SELECT SUM(quantity) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
     FROM orders o ORDER BY o.created_at DESC, o.id DESC LIMIT 6`
  );
  const topProducts = await all(
    env,
    `SELECT oi.product_name, SUM(oi.quantity) AS sold, SUM(oi.line_total) AS revenue
     FROM order_items oi GROUP BY oi.product_name ORDER BY sold DESC LIMIT 5`
  );
  return json({
    stats: { products, categories, orders, newOrders, revenue, customers },
    recentOrders,
    topProducts,
  });
}

/* ---- رفع الصور ---- */
async function adminUpload(request, env, origin) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return err(400, 'فشل قراءة الملف المرفوع.');
  }
  const file = form.get('image');
  if (!file || typeof file === 'string' || !file.size) {
    return err(400, 'لم يتم اختيار صورة.');
  }
  const type = file.type || 'image/jpeg';
  if (!ALLOWED_IMAGE_TYPES.includes(type)) {
    return err(400, 'صيغة الصورة غير مدعومة. المسموح: JPG, PNG, WEBP, GIF, SVG');
  }
  if (file.size > 1_500_000) {
    return err(400, 'حجم الصورة كبير جداً (الحد 1.5 ميغابايت). جرّبي صورة أصغر.');
  }

  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  const data = btoa(bin);

  const name = `img_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
  const info = await run(
    env,
    'INSERT INTO images (filename, content_type, data) VALUES (?, ?, ?)',
    [name, type, data]
  );
  const id = info.meta.last_row_id;
  return json({ url: `${origin}/api/assets/${id}`, filename: `${name}` }, 201);
}

async function adminUploadDelete(env, filename) {
  const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g, '');
  const row = await one(env, 'SELECT id FROM images WHERE filename = ?', [safe]);
  if (!row) return err(404, 'الملف غير موجود.');
  await run(env, 'DELETE FROM images WHERE id = ?', [row.id]);
  return json({ ok: true });
}

/* ---- تقديم الصور المخزّنة ---- */
async function serveAsset(env, idStr) {
  const id = Number(idStr);
  if (!Number.isFinite(id)) return err(404, 'غير موجود.');
  const row = await one(env, 'SELECT content_type, data FROM images WHERE id = ?', [id]);
  if (!row) return err(404, 'الصورة غير موجودة.');
  const bin = atob(row.data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, {
    status: 200,
    headers: { 'Content-Type': row.content_type || 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}

/* ---- تقديم صور المنتجات الافتراضية (SVG مدمجة) ---- */
function serveSeedImage(name) {
  const safe = String(name).replace(/[^a-zA-Z0-9._-]/g, '');
  const svg = SEED_IMAGES[safe];
  if (!svg) return err(404, 'غير موجود.');
  return new Response(svg, {
    status: 200,
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=604800' },
  });
}
