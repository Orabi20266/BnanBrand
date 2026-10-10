# ============================================================
#   Dockerfile — حزمة BnanBrand في صورة واحدة
#   للاستخدام على Render/Railway/Fly أو أي خادم يدعم Docker.
#
#   ملاحظة: تتطلب Node 22.5+ لأن الخادم يستخدم node:sqlite
# ============================================================

# ---------- المرحلة الأولى: تثبيت الحزم وبناء لوحة التحكم ----------
FROM node:24-alpine AS build
WORKDIR /app

# نسخ ملفات الحزم أولاً للاستفادة من التخزين المؤقت للطبقات
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci

# نسخ الكود وبناء لوحة التحكم (client/dist)
COPY . .
RUN npm run build

# ---------- المرحلة الثانية: صورة التشغيل النهائية (أصغر حجماً) ----------
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app

# نسخ كل شيء بعد البناء (يشمل client/dist الجاهز)
COPY --from=build /app .

# المنفذ الذي يستمع عليه الخادم (يضبطه Render/Railway تلقائياً)
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:$PORT/api/health || exit 1

# عند كل إطلاق: تهيئة البيانات (آمنة وغير مدمرة) ثم تشغيل الخادم
CMD ["sh", "-c", "npm run seed && npm run start"]