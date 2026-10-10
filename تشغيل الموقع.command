#!/bin/bash
# ============================================================
#   BnanBrand — تشغيل المتجر ولوحة التحكم بضغطة واحدة
#   انقري مرتين على هذا الملف لتشغيل الموقع في المتصفح
# ============================================================
cd "$(dirname "$0")" || exit 1

PORT=4000
URL="http://localhost:$PORT"

echo "🌸 جارٍ تشغيل متجر BnanBrand..."

# التأكد من وجود Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ لم يتم العثور على Node.js. الرجاء تثبيته من https://nodejs.org"
  read -r -p "اضغطي Enter للإغلاق..."
  exit 1
fi

# إيقاف أي نسخة قديمة تعمل على نفس المنفذ
OLD_PID=$(lsof -ti tcp:$PORT 2>/dev/null)
if [ -n "$OLD_PID" ]; then
  echo "ℹ️  إيقاف نسخة قديمة تعمل على المنفذ $PORT..."
  echo "$OLD_PID" | xargs kill -9 2>/dev/null
  sleep 1
fi

# تشغيل الخادم
node server/index.js &
SERVER_PID=$!

# انتظار جاهزية الخادم
for _ in $(seq 1 20); do
  if curl -s -o /dev/null "$URL/api/health" 2>/dev/null; then break; fi
  sleep 0.5
done

echo ""
echo "✅ الموقع يعمل الآن:"
echo "   المتجر      : $URL"
echo "   لوحة التحكم : $URL/admin   (اسم المستخدم: admin / كلمة المرور: admin123)"
echo ""
echo "⛔ لإيقاف الخادم: اضغطي Ctrl + C أو أغلقي هذه النافذة."
echo ""

# فتح المتصفح
open "$URL" 2>/dev/null || true

# إبقاء النافذة مفتوحة ما دام الخادم يعمل
wait $SERVER_PID
