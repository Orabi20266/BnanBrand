/**
 * رابط المتجر (الجذر) انطلاقاً من مسار لوحة التحكم الحالي.
 * اللوحة تُقدَّم تحت /admin، لذا نرجع للمجلد الأعلى مهما كان مضيف النشر
 * (GitHub Pages: /BnanBrand/admin  →  /BnanBrand/
 *  محلياً:        /admin             →  /)
 */
export const STORE_URL = (() => {
  const path = window.location.pathname.replace(/\/+$/, ''); // إزالة الشرطة المائلة الأخيرة
  const base = path.replace(/\/admin$/, '');                 // إزالة /admin
  return (base || '') + '/';
})();
