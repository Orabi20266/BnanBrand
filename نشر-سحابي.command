#!/bin/bash
# ============================================================
#   BnanBrand — النشر السحابي المجاني على Cloudflare
#   انقري على هذا الملف مرتين، ثم وافقي في المتصفح عندما يطلب.
#   (يُنشئ الخادم + قاعدة البيانات ويضع الموقع على الإنترنت)
# ============================================================
set -e
cd "$(dirname "$0")"

WORKER_DIR="worker"
URL_FILE="$WORKER_DIR/URL.txt"

echo "🌸 BnanBrand — النشر على Cloudflare (مجاني بالكامل)"
echo "===================================================="

echo ""
echo "① تثبيت أدوات Cloudflare (مرة واحدة)..."
(cd "$WORKER_DIR" && npm install --no-audit --no-fund 2>&1 | tail -2)

echo ""
echo "② تسجيل الدخول إلى Cloudflare..."
echo "   ⚠️ سيفتح المتصفح — سجّلي الدخول بحساب مجاني أو أنشئي حساباً"
echo "      ثم اضغطي Allow للسماح للأداة. ارجعي هنا بعدها."
(cd "$WORKER_DIR" && npx wrangler login)

echo ""
echo "③ إنشاء قاعدة البيانات المجانية (D1)..."
DB_ID=""
if command -v python3 >/dev/null 2>&1; then
  DB_ID=$(cd "$WORKER_DIR" && npx wrangler d1 list --json 2>/dev/null | python3 -c "import json,sys
try:
    arr=json.load(sys.stdin)
    print(next((d.get('uuid','') for d in arr if d.get('name')=='bnanbrand'),''))
except Exception:
    print('')")
fi
if [ -z "$DB_ID" ]; then
  CREATE_OUT=$(cd "$WORKER_DIR" && npx wrangler d1 create bnanbrand 2>&1)
  echo "$CREATE_OUT" | tail -4
  DB_ID=$(echo "$CREATE_OUT" | python3 -c "import sys,re; s=sys.stdin.read(); m=re.search(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', s); print(m.group(0) if m else '')")
fi
if [ -z "$DB_ID" ]; then
  echo "❌ تعذّر الحصول على معرف قاعدة البيانات. أعدي المحاولة."
  read -p "اضغطي Enter للإغلاق..." _
  exit 1
fi
echo "   ✅ معرف قاعدة البيانات: $DB_ID"
sed -i '' "s|REPLACE_WITH_DATABASE_ID|$DB_ID|" "$WORKER_DIR/wrangler.toml"

echo ""
echo "④ إنشاء الجداول وبيانات المتجر..."
(cd "$WORKER_DIR" && npx wrangler d1 migrations apply bnanbrand --remote)
(cd "$WORKER_DIR" && npx wrangler d1 execute bnanbrand --remote --file=./seed.sql)

echo ""
echo "⑤ ضبط مفتاح التشفير (JWT)..."
if (cd "$WORKER_DIR" && npx wrangler secret list 2>/dev/null | grep -q JWT_SECRET); then
  echo "   ℹ المفتاح موجود مسبقاً — لن يتغير."
else
  JWT=$(openssl rand -hex 32)
  echo "$JWT" | (cd "$WORKER_DIR" && npx wrangler secret put JWT_SECRET)
  echo "   ✅ تم ضبط مفتاح تشفير عشوائي جديد."
fi

echo ""
echo "⑥ رفع الخادم إلى الإنترنت..."
DEPLOY_OUT=$(cd "$WORKER_DIR" && npx wrangler deploy 2>&1)
echo "$DEPLOY_OUT" | tail -6
URL=$(echo "$DEPLOY_OUT" | grep -o 'https://[a-zA-Z0-9.-]*\.workers\.dev' | head -1)
if [ -n "$URL" ]; then
  echo "$URL" > "$URL_FILE"
  echo ""
  echo "🎉 تم النشر بنجاح!"
  echo "   رابط الخادم (API): $URL"
  echo "   سُجِّل الرابط في الملف: $URL_FILE"
  echo "   🔑 عيّني بيانات الأدمن الخاصة بك من إعدادات Cloudflare (Variables) قبل أول استخدام."
else
  echo ""
  echo "⚠️ تعذّر استخراج رابط النشر — راجعي ما طُبع أعلاه."
fi
echo ""
read -p "اضغطي Enter للإغلاق..." _