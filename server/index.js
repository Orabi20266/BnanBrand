import './env.js';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

import { env } from './env.js';
import { db, initSchema, ensureDefaultSettings, UPLOADS_DIR } from './db.js';
import { authenticate } from './auth.js';

import { authRouter } from './routes/auth.js';
import { categoriesRouter, adminCategoriesRouter } from './routes/categories.js';
import { productsRouter, adminProductsRouter } from './routes/products.js';
import { ordersRouter, adminOrdersRouter } from './routes/orders.js';
import { settingsRouter, adminSettingsRouter, statsRouter } from './routes/admin.js';
import { uploadsRouter } from './routes/uploads.js';

const here = path.dirname(fileURLToPath(import.meta.url));

/* ---------- تهيئة قاعدة البيانات ---------- */
initSchema();
ensureDefaultSettings();

function ensureAdminUser() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count === 0) {
    const hash = bcrypt.hashSync(env.adminPassword, 10);
    db.prepare(
      "INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, 'admin')"
    ).run(env.adminUsername, hash, 'مدير المتجر');
    console.log(`\n👤 تم إنشاء حساب الأدمن: ${env.adminUsername} / ${env.adminPassword}\n`);
  }
}
ensureAdminUser();

/* ---------- التطبيق ---------- */
const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, true); // السماح في التطوير
    },
  })
);

app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'BnanBrand API' }));

// واجهات عامة
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/settings', settingsRouter);

// واجهات الإدارة (محميّة)
app.use('/api/admin/categories', authenticate, adminCategoriesRouter);
app.use('/api/admin/products', authenticate, adminProductsRouter);
app.use('/api/admin/orders', authenticate, adminOrdersRouter);
app.use('/api/admin/settings', authenticate, adminSettingsRouter);
app.use('/api/admin/stats', authenticate, statsRouter);
app.use('/api/admin/uploads', authenticate, uploadsRouter);

/* ---------- خدمة الواجهات ----------
   - واجهة المتجر (ملفات HTML في جذر المشروع + مجلد assets)
   - لوحة تحكم React المبنية من client/dist على /admin
----------------------------------------------------- */
const rootDir = path.join(here, '..');
const distDir = path.join(rootDir, 'client', 'dist');
const storePages = ['index.html', 'products.html', 'about.html', 'contact.html'];

// لوحة التحكم (SPA) على /admin
if (fs.existsSync(distDir)) {
  app.use('/admin', express.static(distDir));
  app.get(/^\/admin(\/.*)?$/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// أصول واجهة المتجر
app.use('/assets', express.static(path.join(rootDir, 'assets')));

// صفحات المتجر
for (const page of storePages) {
  app.get(`/${page}`, (req, res) => res.sendFile(path.join(rootDir, page)));
}
app.get('/', (req, res) => res.sendFile(path.join(rootDir, 'index.html')));

/* ---------- معالج الأخطاء ---------- */
app.use((err, req, res, next) => {
  console.error('✖', err);
  res.status(err.status || 500).json({ error: err.message || 'حدث خطأ في الخادم.' });
});

app.listen(env.port, () => {
  console.log(`\n🌸 BnanBrand API يعمل على: http://localhost:${env.port}`);
  console.log(`   البيئة: ${env.nodeEnv}\n`);
});
