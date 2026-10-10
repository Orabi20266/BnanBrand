import { Router } from 'express';
import { db } from '../db.js';
import { generateOrderNumber, orderWithItems, productToJSON } from '../utils.js';
import { getSetting } from '../db.js';
import { sendOrderEmails } from '../mailer.js';

/* ============ واجهة عامة ============ */
export const ordersRouter = Router();

const VALID_STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

ordersRouter.post('/', async (req, res) => {
  const { customer_name, phone, email = '', address, notes = '', items } = req.body || {};

  if (!customer_name || !phone || !address) {
    return res.status(400).json({ error: 'الاسم ورقم الهاتف وعنوان التوصيل حقول مطلوبة.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'سلة الطلب فارغة.' });
  }

  // إعادة حساب الأسعار من قاعدة البيانات (حماية من التلاعب)
  let subtotal = 0;
  const resolved = [];

  for (const raw of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(raw.product_id));
    if (!product || !product.is_active) continue;

    const p = productToJSON(product);
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

  if (resolved.length === 0) {
    return res.status(400).json({ error: 'لا توجد منتجات صالحة في الطلب.' });
  }

  const shippingFee = Number(getSetting('shipping_fee', '0')) || 0;
  const freeThreshold = Number(getSetting('free_shipping_threshold', '0')) || 0;
  const shipping = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : shippingFee;
  const discount = 0;
  const total = subtotal - discount + shipping;

  const orderNumber = generateOrderNumber();

  const insertOrder = db.prepare(
    `INSERT INTO orders
      (order_number, customer_name, phone, email, address, notes, subtotal, discount, shipping, total, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`
  );
  const info = insertOrder.run(
    orderNumber,
    String(customer_name).trim(),
    String(phone).trim(),
    String(email).trim(),
    String(address).trim(),
    String(notes).trim(),
    subtotal,
    discount,
    shipping,
    total
  );

  const orderId = info.lastInsertRowid;
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, product_name, variant, unit_price, quantity, line_total)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const it of resolved) {
    insertItem.run(orderId, it.product_id, it.product_name, it.variant, it.unit_price, it.quantity, it.line_total);
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const full = orderWithItems(order);

  // إرسال البريد دون تعطيل الاستجابة عند الفشل
  sendOrderEmails(full, full.items).catch((err) => console.error('mail error:', err.message));

  res.status(201).json({ order: full });
});

ordersRouter.get('/track/:orderNumber', (req, res) => {
  const order = db
    .prepare('SELECT * FROM orders WHERE order_number = ?')
    .get(String(req.params.orderNumber).trim());
  if (!order) return res.status(404).json({ error: 'لم يتم العثور على طلب بهذا الرقم.' });
  res.json({ order: orderWithItems(order) });
});

/* ============ إدارة (تتطلب مصادقة) ============ */
export const adminOrdersRouter = Router();

adminOrdersRouter.get('/', (req, res) => {
  const { status = '', search = '' } = req.query;
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

  const rows = db
    .prepare(
      `SELECT o.*, (
         SELECT SUM(quantity) FROM order_items oi WHERE oi.order_id = o.id
       ) AS items_count
       FROM orders o
       ${whereSql}
       ORDER BY o.created_at DESC, o.id DESC`
    )
    .all(...params);

  res.json({ items: rows });
});

adminOrdersRouter.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'الطلب غير موجود.' });
  res.json({ order: orderWithItems(order) });
});

adminOrdersRouter.put('/:id/status', (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'حالة الطلب غير صالحة.' });
  }
  const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'الطلب غير موجود.' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  res.json({ order: orderWithItems(db.prepare('SELECT * FROM orders WHERE id = ?').get(id)) });
});

adminOrdersRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'الطلب غير موجود.' });
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  res.json({ ok: true });
});
