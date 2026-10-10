const isLocal =
  typeof location !== 'undefined' &&
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

// محلياً: نفس الخادم (''). على الإنترنت: خادم Cloudflare (من .env.production)
const BASE = isLocal ? '' : import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('bnan_token') || '';
}

async function request(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  const opts = { method, headers: { ...headers } };
  const token = getToken();
  if (token) opts.headers.Authorization = `Bearer ${token}`;

  if (body != null) {
    if (isForm) {
      opts.body = body;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const error = new Error(data.error || 'حدث خطأ غير متوقع.');
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData, isForm: true }),
};

export const money = (value, currency = '₪') =>
  `${Number(value || 0).toFixed(2)} ${currency}`;

export const STATUS_LABELS = {
  new: 'جديد',
  confirmed: 'مؤكَّد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'ملغى',
};

export const STATUS_STYLES = {
  new: 'bg-blush-200 text-brand-dark',
  confirmed: 'bg-violet-100 text-violet-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-sky-100 text-sky-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};
