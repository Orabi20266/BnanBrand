/* ==========================================================
   BnanBrand — إعداد عنوان الخادم (API)
   - على جهازك (localhost): يستخدم الخادم المحلي كما هو.
   - على الإنترنت (GitHub Pages): يستخدم خادم Cloudflare المجاني.
   ========================================================== */
(function () {
  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';
  window.BNAN_API_URL = isLocal ? '' : 'https://bnanbrand-api.bnanbrand.workers.dev';
  // مسار لوحة التحكم (نسبي: يعمل على الموقع المحلي وعلى GitHub Pages)
  window.BNAN_ADMIN_URL = 'admin/';
})();
