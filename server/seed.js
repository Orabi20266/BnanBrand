import './env.js';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { db, initSchema, ensureDefaultSettings, slugify, UPLOADS_DIR } from './db.js';
import { env } from './env.js';

initSchema();
ensureDefaultSettings();

const force = process.argv.includes('--force');

/* ---------- صور مؤقتة (SVG) ---------- */
function writeSvg(slug, title, emoji, from, to) {
  const file = path.join(UPLOADS_DIR, `seed-${slug}.svg`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="400" cy="330" r="150" fill="#ffffff" opacity="0.55"/>
  <text x="400" y="380" font-size="150" text-anchor="middle">${emoji}</text>
  <text x="400" y="620" font-size="46" text-anchor="middle" fill="#8a3a58"
        font-family="Segoe UI, Tahoma, Arial" font-weight="bold">${title}</text>
  <text x="400" y="680" font-size="26" text-anchor="middle" fill="#b9638a"
        font-family="Segoe UI, Tahoma, Arial" letter-spacing="6">BnanBrand</text>
</svg>`;
  fs.writeFileSync(file, svg, 'utf8');
  return `/uploads/seed-${slug}.svg`;
}

/* ---------- الأقسام ---------- */
const categories = [
  { name: 'إكسسوارات', emoji: '💍', from: '#FFD7E8', to: '#FFB6D9' },
  { name: 'صناديق هدايا', emoji: '🎁', from: '#FFE3EF', to: '#FFC0CB' },
  { name: 'عطور', emoji: '🌸', from: '#FFD1E3', to: '#E75480' },
  { name: 'عناية بالبشرة', emoji: '🧴', from: '#FFE9F3', to: '#FFB6D9' },
  { name: 'مجوهرات', emoji: '👑', from: '#FBE4EE', to: '#E9A0C0' },
];

/* ---------- المنتجات ---------- */
const products = [
  {
    name: 'طقم إكسسوارات ذهبي وردي',
    category: 'إكسسوارات',
    emoji: '💍',
    price: 320,
    discount_price: 259,
    description: 'طقم أنيق من الإكسسوارات بلمسة ذهبية وردية، مثالي للمناسبات والهدايا. يشمل قلادة وأسورة وحلقاً بتصميم متناسق.',
    variants: [{ name: 'اللون', options: ['ذهبي وردي', 'فضي', 'ذهبي'] }],
    stock: 24,
    featured: 1,
  },
  {
    name: 'صندوق هدايا فاخر بخاتم',
    category: 'صناديق هدايا',
    emoji: '🎁',
    price: 280,
    discount_price: null,
    description: 'صندوق هدايا مخملي فاخر بلون وردي، يحتوي على خاتم مزخرف وبطاقة إهداء. تغليف راقٍ جاهز للإهداء.',
    variants: [{ name: 'الحجم', options: ['صغير', 'متوسط', 'كبير'] }],
    stock: 18,
    featured: 1,
  },
  {
    name: 'عطر زهري نسائي',
    category: 'عطور',
    emoji: '🌸',
    price: 420,
    discount_price: 349,
    description: 'عطر نسائي برائحة زهرية ناعمة تدوم طويلاً، بمزيج من الياسمين والورد. مناسب للاستخدام اليومي والمناسبات.',
    variants: [{ name: 'الحجم', options: ['30 مل', '50 مل', '100 مل'] }],
    stock: 30,
    featured: 1,
  },
  {
    name: 'طقم عناية بالبشرة فاخر',
    category: 'عناية بالبشرة',
    emoji: '🧴',
    price: 260,
    discount_price: null,
    description: 'مجموعة عناية متكاملة بالبشرة تحتوي على غسول، سيروم، وكريم مرطب بخلاصات طبيعية لطيفة على البشرة.',
    variants: [],
    stock: 40,
    featured: 1,
  },
  {
    name: 'قلادة قلب وردية',
    category: 'مجوهرات',
    emoji: '👑',
    price: 210,
    discount_price: 179,
    description: 'قلادة بتصميم قلب بلون وردي وتفاصيل لامعة، تعبير رومانسي أنيق. سلسلة قابلة للتعديل.',
    variants: [
      { name: 'اللون', options: ['وردي', 'ذهبي', 'فضي'] },
      { name: 'الطول', options: ['40 سم', '45 سم'] },
    ],
    stock: 15,
    featured: 0,
  },
  {
    name: 'علبة إكسسوارات منظمة',
    category: 'إكسسوارات',
    emoji: '👛',
    price: 150,
    discount_price: 120,
    description: 'علبة أنيقة لحفظ الإكسسوارات بسطح مخملي وتقسيمات متعددة، تحمي قطعك الثمينة وتبقيها منظمة.',
    variants: [{ name: 'اللون', options: ['وردي', 'بيج', 'أسود'] }],
    stock: 35,
    featured: 0,
  },
  {
    name: 'صندوق هدايا للمناسبات الصغيرة',
    category: 'صناديق هدايا',
    emoji: '💐',
    price: 190,
    discount_price: null,
    description: 'صندوق هدايا أنيق يحتوي على مستلزمات صغيرة ومتنوعة، مناسب لأعياد الميلاد وشكر الضيوف.',
    variants: [{ name: 'الحجم', options: ['صغير', 'متوسط'] }],
    stock: 22,
    featured: 0,
  },
  {
    name: 'مجموعة عطور مصغرة',
    category: 'عطور',
    emoji: '💗',
    price: 230,
    discount_price: 189,
    description: 'مجموعة من ثلاثة عطور مصغرة بروائح زهرية متنوعة، مثالية للتجربة أو كهدية.',
    variants: [],
    stock: 26,
    featured: 0,
  },
  {
    name: 'كريم مرطب بماء الورد',
    category: 'عناية بالبشرة',
    emoji: '🌷',
    price: 110,
    discount_price: null,
    description: 'كريم مرطب غني بماء الورد يمنح البشرة نعومة وانتعاشاً طوال اليوم، مناسب لجميع أنواع البشرة.',
    variants: [{ name: 'الحجم', options: ['50 مل', '100 مل'] }],
    stock: 50,
    featured: 0,
  },
  {
    name: 'خاتم زفاف مزيّن',
    category: 'مجوهرات',
    emoji: '💎',
    price: 480,
    discount_price: 399,
    description: 'خاتم أنيق بتصميم مزخرف وحجر لامع، قطعة مميزة للمناسبات الخاصة والخطوبة.',
    variants: [{ name: 'المقاس', options: ['5', '6', '7', '8', '9'] }],
    stock: 12,
    featured: 1,
  },
  {
    name: 'سوار مطعّم بحجر وردي',
    category: 'إكسسوارات',
    emoji: '📿',
    price: 175,
    discount_price: null,
    description: 'سوار أنيق بحجر وردي في المنتصف، خفيف ومريح للاستخدام اليومي.',
    variants: [{ name: 'اللون', options: ['وردي', 'بنفسجي'] }],
    stock: 28,
    featured: 0,
  },
  {
    name: 'صندوق مفاجأة لهدية مميزة',
    category: 'صناديق هدايا',
    emoji: '🎀',
    price: 350,
    discount_price: 299,
    description: 'صندوق هدايا متكامل بكشف مفاجآت تدريجي، تجربة إهداء لا تُنسى بلمسة أنثوية راقية.',
    variants: [{ name: 'اللون', options: ['وردي', 'أبيض'] }],
    stock: 16,
    featured: 1,
  },
];

/* ---------- التنفيذ ---------- */
const existing = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;

if (existing > 0 && !force) {
  console.log(`ℹ يوجد ${existing} منتجاً في قاعدة البيانات. استخدم "npm run seed -- --force" لإعادة التوليد.`);
} else {
  if (force) {
    db.exec('DELETE FROM order_items; DELETE FROM orders; DELETE FROM products; DELETE FROM categories;');
    console.log('🗑  تم حذف البيانات القديمة (وضع --force).');
  }

  const insertCategory = db.prepare(
    'INSERT INTO categories (name, slug, description, image, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)'
  );
  const categoryIds = {};
  categories.forEach((cat, index) => {
    const slug = slugify(cat.name);
    const image = writeSvg(slug, cat.name, cat.emoji, cat.from, cat.to);
    const info = insertCategory.run(cat.name, slug, `تشكيلة ${cat.name} الفاخرة من BnanBrand.`, image, index);
    categoryIds[cat.name] = info.lastInsertRowid;
  });
  console.log(`✅ تمت إضافة ${categories.length} قسماً.`);

  const insertProduct = db.prepare(
    `INSERT INTO products
      (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
  );
  products.forEach((p) => {
    const slug = slugify(p.name);
    const image = writeSvg(slug, p.name, p.emoji, '#FFE3EF', '#FFB6D9');
    insertProduct.run(
      p.name,
      slug,
      p.description,
      categoryIds[p.category] ?? null,
      p.price,
      p.discount_price,
      image,
      JSON.stringify([image]),
      JSON.stringify(p.variants),
      p.stock,
      p.featured
    );
  });
  console.log(`✅ تمت إضافة ${products.length} منتجاً.`);
}

/* ---------- حساب الأدمن ---------- */
const adminExists = db.prepare('SELECT 1 FROM users WHERE username = ?').get(env.adminUsername);
if (!adminExists) {
  db.prepare(
    "INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, 'admin')"
  ).run(env.adminUsername, bcrypt.hashSync(env.adminPassword, 10), 'مدير المتجر');
  console.log(`✅ تم إنشاء حساب الأدمن: ${env.adminUsername} / ${env.adminPassword}`);
} else {
  console.log(`ℹ حساب الأدمن "${env.adminUsername}" موجود مسبقاً.`);
}

console.log('\n🌸 اكتملت تهيئة البيانات.');
