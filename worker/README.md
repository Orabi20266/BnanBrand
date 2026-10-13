# 🌸 BnanBrand — خادم Cloudflare المجاني (Workers + D1)

بديل مجاني بالكامل للخادم المحلي (Express + SQLite):
- **Cloudflare Workers** — يشغّل كل واجهات الـ API (منتجات، طلبات، عملاء، لوحة أدمن).
- **Cloudflare D1** — قاعدة بيانات SQLite مجانية (5GB) تخزّن كل شيء: المنتجات، الطلبات، الحسابات، الصور.
- **بدون بطاقة دفع** وبدون نوم للخادم وبدون حدود خانقة لموقع صغير.

## بنية الملفات
```
worker/
  wrangler.toml          إعداد Cloudflare (الاسم + قاعدة البيانات)
  migrations/0001_init.sql   إنشاء الجداول
  seed.sql               بيانات أولية (أدمن، أقسام، 12 منتجاً، إعدادات) — مولّدة
  src/
    index.js             الموجّه لكل الواجهات (مطابق لواجهات الخادم المحلي)
    auth.js              المصادقة: PBKDF2 + JWT (HS256) عبر WebCrypto
    db.js                أدوات D1
    utils.js             تحويل المنتجات/الطلبات إلى JSON
    seed-images.js       صور المنتجات الافتراضية (SVG) — مولّدة
  tools/
    gen.js               يولّد seed.sql و seed-images.js
  URL.txt                (يُنشأ بعد النشر) رابط الخادم
```

## النشر (مرة واحدة)
أسهل طريقة: **انقري نقراً مزدوجاً على `نشر-سحابي.command`** في جذر المشروع،
وسجّلي الدخول في المتصفح عندما يطلب (حساب Cloudflare مجاني أو جديد).

أو يدوياً:
```bash
cd worker
npm install
npx wrangler login          # تسجيل الدخول عبر المتصفح
npx wrangler d1 create bnanbrand   # انسخي database_id إلى wrangler.toml
npx wrangler d1 migrations apply bnanbrand --remote
npx wrangler d1 execute bnanbrand --remote --file=./seed.sql
echo "مفتاح-عشوائي-طويل" | npx wrangler secret put JWT_SECRET
npx wrangler deploy
```
سيطبع الأمر الأخير رابط الخادم مثل `https://bnanbrand-api.xxx.workers.dev`
— انسخيه في:
1. `assets/js/config.js` (السطر `window.BNAN_API_URL = ...`)
2. `client/.env.production` (`VITE_API_URL=...`)

ثم أعدي بناء لوحة التحكم وارفعي للمستودع:
```bash
cd .. && npm run build
git add -A && git commit -m "ربط الموقع بخادم Cloudflare" && git push
```

## بيانات الأدمن
- اسم المستخدم وكلمة المرور تُضبطان عبر متغيّرات البيئة عند التوليد:
  `ADMIN_USERNAME` و `ADMIN_PASSWORD` (وإلّا يُستخدم بديل مؤقت غير آمن).
- على Cloudflare: غيّريها من **Settings → Variables** أو من صفحة «الإعدادات» في اللوحة،
  أو أعيدي تشغيل `seed.sql` بعد توليد hash جديد بـ `tools/gen.js`.

## ملاحظات
- الصور التي يرفعها الأدمن تُصغَّر تلقائياً في المتصفح وتُخزَّن في قاعدة البيانات (بدون ملفات خارجية).
- إرسال البريد غير مفعّل (بدون SMTP) — تُسجَّل الطلبات في قاعدة البيانات فقط.
- لتغيير المنتجات الأولية: عدّلي `tools/gen.js` ثم `node tools/gen.js` وأعيدي تشغيل seed.