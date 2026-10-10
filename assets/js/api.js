/* ==========================================================
   BnanBrand — جسر الربط مع الخادم (API)
   يحمّل الأقسام والمنتجات والإعدادات من الـ API
   ويوفّر إرسال الطلبات الحقيقي.
   ========================================================== */
(function () {
  const TOKEN_KEY = 'bnan_token';

  /* عنوان الخادم: محلي أو Cloudflare (يُضبط في assets/js/config.js) */
  function apiUrl(path) {
    return (window.BNAN_API_URL || '') + path;
  }

  function authHeaders() {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { Authorization: 'Bearer ' + t } : {};
  }

  async function handle(res) {
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { /* صفحة 404 HTML مثل GitHub Pages */ }
    if (!res.ok) throw new Error(data.error || 'تعذّر الاتصال بالخادم.');
    return data;
  }

  const BnanAPI = {
    get(path) {
      return fetch(apiUrl(path), { headers: authHeaders() }).then(handle);
    },
    post(path, body) {
      return fetch(apiUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body || {}),
      }).then(handle);
    },
    put(path, body) {
      return fetch(apiUrl(path), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body || {}),
      }).then(handle);
    },
    remove(path) {
      return fetch(apiUrl(path), { method: 'DELETE', headers: authHeaders() }).then(handle);
    },
    /* إرسال طلب حقيقي */
    submitOrder(payload) {
      return this.post('/api/orders', payload);
    },
    /* المصادقة: دخول / تسجيل / بياناتي */
    login(payload) {
      return this.post('/api/auth/login', payload);
    },
    register(payload) {
      return this.post('/api/auth/register', payload);
    },
    me() {
      return this.get('/api/auth/me');
    },
  };

  window.BnanAPI = BnanAPI;

  /* تحويل منتج الـ API إلى الشكل الذي يتوقعه الموقع القديم */
  function mapProduct(p) {
    const hasDiscount = p.has_discount && p.discount_price != null && p.price > 0;
    const discount = hasDiscount
      ? Math.max(1, Math.round((1 - p.discount_price / p.price) * 100))
      : 0;
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const variantSummary = variants
      .map((v) => `${v.name}: ${(v.options || []).join('، ')}`)
      .join(' • ');

    return {
      id: String(p.id),
      sku: 'BN-' + String(p.id).padStart(3, '0'),
      name: p.name,
      category: p.category_slug || 'all',
      price: p.price,
      oldPrice: null,
      discount,
      unit: 'قطعة',
      rating: 4.8,
      reviews: 0,
      stock: p.stock,
      badge: p.is_featured ? 'مميز' : '',
      material: p.category_name || '',
      dims: variants[0] ? variants[0].name : '-',
      weight: '-',
      short: (p.description || '').slice(0, 70),
      desc: p.description || '',
      features: [],
      colors: ['#FFB6D9', '#E75480'],
      group: 'default',
      image: p.image || '',
      images: Array.isArray(p.images) ? p.images : [],
      variants,
      variantSummary,
      soldOut: p.stock <= 0,
    };
  }

  window.__bnanReady = (async () => {
    // عند فتح ملف index.html مباشرة (file://) لا يوجد خادم — نستخدم البيانات المحلية
    if (location.protocol === 'file:') {
      window.BnanCurrency = window.BnanCurrency || 'شيكل';
      window.BnanOffline = true;
      return;
    }
    try {
      const [settingsRes, catsRes, prodsRes] = await Promise.all([
        BnanAPI.get('/api/settings'),
        BnanAPI.get('/api/categories'),
        BnanAPI.get('/api/products?limit=200'),
      ]);

      const settings = settingsRes.settings || {};
      window.BnanSettings = settings;

      /* الأقسام */
      if (typeof CATEGORIES !== 'undefined') {
        CATEGORIES.length = 0;
        CATEGORIES.push({ id: 'all', name: 'الكل', icon: 'grid' });
        (catsRes.items || []).forEach((c) =>
          CATEGORIES.push({ id: c.slug, name: c.name, icon: 'box' })
        );
      }

      /* المنتجات */
      if (typeof PRODUCTS !== 'undefined' && Array.isArray(prodsRes.items)) {
        PRODUCTS = prodsRes.items.map(mapProduct);
      }

      /* معلومات التواصل */
      if (typeof CONTACT !== 'undefined') {
        if (settings.phone) CONTACT.phone = settings.phone;
        if (settings.whatsapp) CONTACT.whatsapp = String(settings.whatsapp).replace(/\D/g, '');
        if (settings.company_email) CONTACT.email = settings.company_email;
        if (settings.address) CONTACT.address = settings.address;
      }
      if (settings.company_name) window.BnanBrandName = settings.company_name;
      if (settings.currency) window.BnanCurrency = settings.currency;
    } catch (err) {
      console.warn('⚠ تعذّر تحميل بيانات الخادم، سيتم استخدام البيانات المحلية:', err.message);
      window.BnanOffline = true;
    }
  })();
})();
