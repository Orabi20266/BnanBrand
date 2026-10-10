/* ==========================================================
   تصغير الصور قبل الرفع
   حتى تبقى صغيرة وتُخزَّن داخل قاعدة بيانات Cloudflare المجانية.
   ========================================================== */
export async function shrinkImage(file, { maxSize = 900, quality = 0.82, maxBytes = 900 * 1024 } = {}) {
  if (!file) return file;
  // الصور المتجهية والصور المتحركة لا تُضغط بالـ canvas
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    const scale = Math.min(1, maxSize / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    if (bitmap.close) bitmap.close();

    let q = quality;
    let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', q));
    while (blob && blob.size > maxBytes && q > 0.4) {
      q -= 0.12;
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', q));
    }
    if (!blob) return file;

    const name = (file.name || 'image').replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
