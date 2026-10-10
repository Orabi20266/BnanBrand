import { Router } from 'express';
import { db, getSettings, setSetting, DEFAULT_SETTINGS } from '../db.js';
import { publicSettings } from '../utils.js';

/* واجهة عامة: الإعدادات الظاهرة للزبون */
export const settingsRouter = Router();

settingsRouter.get('/', (req, res) => {
  res.json({ settings: publicSettings() });
});

/* إدارة الإعدادات */
export const adminSettingsRouter = Router();

adminSettingsRouter.get('/', (req, res) => {
  res.json({ settings: { ...DEFAULT_SETTINGS, ...getSettings() } });
});

adminSettingsRouter.put('/', (req, res) => {
  const allowed = Object.keys(DEFAULT_SETTINGS);
  const body = req.body || {};
  for (const key of allowed) {
    if (key in body) setSetting(key, body[key]);
  }
  res.json({ settings: { ...DEFAULT_SETTINGS, ...getSettings() } });
});

/* إحصائيات لوحة التحكم */
export const statsRouter = Router();

statsRouter.get('/', (req, res) => {
  const products = db.prepare('SELECT COUNT(*) AS c FROM products WHERE is_active = 1').get().c;
  const categories = db.prepare('SELECT COUNT(*) AS c FROM categories WHERE is_active = 1').get().c;
  const orders = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  const newOrders = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'new'").get().c;
  const revenue = db
    .prepare("SELECT COALESCE(SUM(total), 0) AS s FROM orders WHERE status <> 'cancelled'")
    .get().s;
  const customers = db.prepare('SELECT COUNT(DISTINCT phone) AS c FROM orders').get().c;

  const recentOrders = db
    .prepare(
      `SELECT o.*, (SELECT SUM(quantity) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
       FROM orders o ORDER BY o.created_at DESC, o.id DESC LIMIT 6`
    )
    .all();

  const topProducts = db
    .prepare(
      `SELECT oi.product_name, SUM(oi.quantity) AS sold, SUM(oi.line_total) AS revenue
       FROM order_items oi
       GROUP BY oi.product_name
       ORDER BY sold DESC
       LIMIT 5`
    )
    .all();

  res.json({
    stats: { products, categories, orders, newOrders, revenue, customers },
    recentOrders,
    topProducts,
  });
});
