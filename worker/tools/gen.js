/* ==========================================================
   مولّد بيانات البذر لـ Cloudflare D1
   يُنتج:
     - worker/seed.sql            (الحساب + الأقسام + المنتجات + الإعدادات)
     - worker/src/seed-images.js  (صور SVG مدمجة تُقدَّم من الـ Worker)
   التشغيل:  node worker/tools/gen.js
   ========================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const workerDir = path.join(here, '..');

/* ---- نفس دالة الخادم المحلي ---- */
function slugify(text = '') {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const esc = (v) => String(v ?? '').replace(/'/g, "''");

/* ---- الأقسام (نفس server/seed.js) ---- */
const categories = [
  { name: 'إكسسوارات', emoji: '💍', from: '#FFD7E8', to: '#FFB6D9' },
  { name: 'صناديق هدايا', emoji: '🎁', from: '#FFE3EF', to: '#FFC0CB' },
  { name: 'عطور', emoji: '🌸', from: '#FFD1E3', to: '#E75480' },
  { name: 'عناية بالبشرة', emoji: '🧴', from: '#FFE9F3', to: '#FFB6D9' },
  { name: 'مجوهرات', emoji: '👑', from: '#FBE4EE', to: '#E9A0C0' },
];

/* ---- المنتجات (نفس server/seed.js) ---- */
const products = [
  { name: 'طقم إكسسوارات ذهبي وردي', category: 'إكسسوارات', emoji: '💍', price: 320, discount_price: 259, description: 'طقم أنيق من الإكسسوارات بلمسة ذهبية وردية، مثالي للمناسبات والهدايا. يشمل قلادة وأسورة وحلقاً بتصميم متناسق.', variants: [{ name: 'اللون', options: ['ذهبي وردي', 'فضي', 'ذهبي'] }], stock: 24, featured: 1 },
  { name: 'صندوق هدايا فاخر بخاتم', category: 'صناديق هدايا', emoji: '🎁', price: 280, discount_price: null, description: 'صندوق هدايا مخملي فاخر بلون وردي، يحتوي على خاتم مزخرف وبطاقة إهداء. تغليف راقٍ جاهز للإهداء.', variants: [{ name: 'الحجم', options: ['صغير', 'متوسط', 'كبير'] }], stock: 18, featured: 1 },
  { name: 'عطر زهري نسائي', category: 'عطور', emoji: '🌸', price: 420, discount_price: 349, description: 'عطر نسائي برائحة زهرية ناعمة تدوم طويلاً، بمزيج من الياسمين والورد. مناسب للاستخدام اليومي والمناسبات.', variants: [{ name: 'الحجم', options: ['30 مل', '50 مل', '100 مل'] }], stock: 30, featured: 1 },
  { name: 'طقم عناية بالبشرة فاخر', category: 'عناية بالبشرة', emoji: '🧴', price: 260, discount_price: null, description: 'مجموعة عناية متكاملة بالبشرة تحتوي على غسول، سيروم، وكريم مرطب بخلاصات طبيعية لطيفة على البشرة.', variants: [], stock: 40, featured: 1 },
  { name: 'قلادة قلب وردية', category: 'مجوهرات', emoji: '👑', price: 210, discount_price: 179, description: 'قلادة بتصميم قلب بلون وردي وتفاصيل لامعة، تعبير رومانسي أنيق. سلسلة قابلة للتعديل.', variants: [{ name: 'اللون', options: ['وردي', 'ذهبي', 'فضي'] }, { name: 'الطول', options: ['40 سم', '45 سم'] }], stock: 15, featured: 0 },
  { name: 'علبة إكسسوارات منظمة', category: 'إكسسوارات', emoji: '👛', price: 150, discount_price: 120, description: 'علبة أنيقة لحفظ الإكسسوارات بسطح مخملي وتقسيمات متعددة، تحمي قطعك الثمينة وتبقيها منظمة.', variants: [{ name: 'اللون', options: ['وردي', 'بيج', 'أسود'] }], stock: 35, featured: 0 },
  { name: 'صندوق هدايا للمناسبات الصغيرة', category: 'صناديق هدايا', emoji: '💐', price: 190, discount_price: null, description: 'صندوق هدايا أنيق يحتوي على مستلزمات صغيرة ومتنوعة، مناسب لأعياد الميلاد وشكر الضيوف.', variants: [{ name: 'الحجم', options: ['صغير', 'متوسط'] }], stock: 22, featured: 0 },
  { name: 'مجموعة عطور مصغرة', category: 'عطور', emoji: '💗', price: 230, discount_price: 189, description: 'مجموعة من ثلاثة عطور مصغرة بروائح زهرية متنوعة، مثالية للتجربة أو كهدية.', variants: [], stock: 26, featured: 0 },
  { name: 'كريم مرطب بماء الورد', category: 'عناية بالبشرة', emoji: '🌷', price: 110, discount_price: null, description: 'كريم مرطب غني بماء الورد يمنح البشرة نعومة وانتعاشاً طوال اليوم، مناسب لجميع أنواع البشرة.', variants: [{ name: 'الحجم', options: ['50 مل', '100 مل'] }], stock: 50, featured: 0 },
  { name: 'خاتم زفاف مزيّن', category: 'مجوهرات', emoji: '💎', price: 480, discount_price: 399, description: 'خاتم أنيق بتصميم مزخرف وحجر لامع، قطعة مميزة للمناسبات الخاصة والخطوبة.', variants: [{ name: 'المقاس', options: ['5', '6', '7', '8', '9'] }], stock: 12, featured: 1 },
  { name: 'سوار مطعّم بحجر وردي', category: 'إكسسوارات', emoji: '📿', price: 175, discount_price: null, description: 'سوار أنيق بحجر وردي في المنتصف، خفيف ومريح للاستخدام اليومي.', variants: [{ name: 'اللون', options: ['وردي', 'بنفسجي'] }], stock: 28, featured: 0 },
  { name: 'صندوق مفاجأة لهدية مميزة', category: 'صناديق هدايا', emoji: '🎀', price: 350, discount_price: 299, description: 'صندوق هدايا متكامل بكشف مفاجآت تدريجي، تجربة إهداء لا تُنسى بلمسة أنثوية راقية.', variants: [{ name: 'اللون', options: ['وردي', 'أبيض'] }], stock: 16, featured: 1 },
];

const DEFAULT_SETTINGS = {
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

/* ---- توليد صورة SVG مدمجة (نفس تصميم الخادم المحلي) ---- */
function makeSvg(title, emoji, from, to) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
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
}

/* ---- حساب تجزئة كلمة مرور الأدمن (PBKDF2 مطابق للـ Worker) ---- */
function b64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return Buffer.from(bin, 'binary').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function hashPassword(password) {
  const enc = new TextEncoder();
  const iterations = 100000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256)
  );
  return `pbkdf2$${iterations}$${b64url(salt)}$${b64url(bits)}`;
}

async function main() {
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'change-me-admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me-strong-password';
  const adminHash = await hashPassword(ADMIN_PASSWORD);

  const lines = [];
  lines.push('-- بيانات BnanBrand الأولية (تُنشئ حساب الأدمن + الأقسام + المنتجات + الإعدادات)');
  lines.push('-- مولّد آلياً بواسطة worker/tools/gen.js');
  lines.push('');
  lines.push('-- تنظيف آمن يسمح بإعادة التشغيل دون تكرار البيانات');
  lines.push('DELETE FROM order_items;');
  lines.push('DELETE FROM orders;');
  lines.push('DELETE FROM products;');
  lines.push('DELETE FROM categories;');
  lines.push('DELETE FROM images;');
  lines.push('');

  /* الأدمن */
  lines.push('DELETE FROM users WHERE username = ' + `'${esc(ADMIN_USERNAME)}';`);
  lines.push(
    `INSERT INTO users (username, password_hash, full_name, role) VALUES ('${esc(ADMIN_USERNAME)}', '${esc(adminHash)}', 'مدير المتجر', 'admin');`
  );
  lines.push('');

  /* الأقسام */
  const imagesMap = {};
  categories.forEach((cat, index) => {
    const slug = slugify(cat.name);
    const file = `seed-${slug}.svg`;
    imagesMap[file] = makeSvg(cat.name, cat.emoji, cat.from, cat.to);
    lines.push(
      `INSERT INTO categories (id, name, slug, description, image, sort_order, is_active) VALUES (${index + 1}, '${esc(cat.name)}', '${esc(slug)}', '${esc('تشكيلة ' + cat.name + ' الفاخرة من BnanBrand.')}', '${esc('/uploads/' + file)}', ${index}, 1);`
    );
  });
  lines.push('');

  /* المنتجات */
  const catId = {};
  categories.forEach((c, i) => (catId[c.name] = i + 1));
  products.forEach((p) => {
    const slug = slugify(p.name);
    const file = `seed-${slug}.svg`;
    imagesMap[file] = makeSvg(p.name, p.emoji, '#FFE3EF', '#FFB6D9');
    const image = '/uploads/' + file;
    const discount = p.discount_price == null ? 'NULL' : String(p.discount_price);
    lines.push(
      `INSERT INTO products (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active) VALUES ('${esc(p.name)}', '${esc(slug)}', '${esc(p.description)}', ${catId[p.category]}, ${p.price}, ${discount}, '${esc(image)}', '${esc(JSON.stringify([image]))}', '${esc(JSON.stringify(p.variants))}', ${p.stock}, ${p.featured}, 1);`
    );
  });
  lines.push('');

  /* الإعدادات */
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    lines.push(
      `INSERT INTO settings (key, value) VALUES ('${esc(key)}', '${esc(value)}') ON CONFLICT(key) DO UPDATE SET value = excluded.value;`
    );
  }
  lines.push('');
  lines.push('-- تم.');

  fs.writeFileSync(path.join(workerDir, 'seed.sql'), lines.join('\n'), 'utf8');
  console.log('✅ كُتب worker/seed.sql');

  /* ملف الصور المدمجة */
  const imgLines = [];
  imgLines.push('/* صور المنتجات/الأقسام الافتراضية (SVG) — مولّدة آلياً بواسطة worker/tools/gen.js */');
  imgLines.push('export const SEED_IMAGES = {');
  for (const [file, svg] of Object.entries(imagesMap)) {
    imgLines.push(`  ${JSON.stringify(file)}: ${JSON.stringify(svg)},`);
  }
  imgLines.push('};');
  imgLines.push('');
  fs.writeFileSync(path.join(workerDir, 'src', 'seed-images.js'), imgLines.join('\n'), 'utf8');
  console.log(`✅ كُتب worker/src/seed-images.js (${Object.keys(imagesMap).length} صورة)`);
}

main();
