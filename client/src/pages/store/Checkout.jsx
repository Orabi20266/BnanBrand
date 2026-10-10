import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, money } from '../api.js';
import { Icon } from '../components/Icons.jsx';
import { EmptyState } from '../components/Loading.jsx';

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { settings } = useSettings();
  const { show } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const freeThreshold = settings.free_shipping_threshold || 0;
  const shipping = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : settings.shipping_fee;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="container-x py-16">
        <EmptyState title="لا يمكن إتمام طلب فارغ">
          <Link to="/products" className="btn-primary">ابدئي التسوق</Link>
        </EmptyState>
      </div>
    );
  }

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.customer_name.trim()) e.customer_name = 'الاسم مطلوب';
    if (!form.phone.trim()) e.phone = 'رقم الهاتف مطلوب';
    else if (!/^[0-9+\s-]{7,}$/.test(form.phone.trim())) e.phone = 'رقم الهاتف غير صالح';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = 'البريد الإلكتروني غير صالح';
    if (!form.address.trim()) e.address = 'عنوان التوصيل مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: items.map((it) => ({
          product_id: it.product_id,
          variant: it.variant,
          quantity: it.quantity,
        })),
      };
      const data = await api.post('/api/orders', payload);
      clear();
      navigate(`/order/${data.order.order_number}`);
    } catch (err) {
      show(err.message || 'تعذّر إرسال الطلب', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-bold text-ink">إتمام الطلب</h1>

      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="card space-y-5 p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Icon.User className="h-5 w-5 text-brand" /> بيانات التوصيل
          </h2>

          <Field label="الاسم الكامل *" error={errors.customer_name}>
            <input
              className="input"
              value={form.customer_name}
              onChange={(e) => setField('customer_name', e.target.value)}
              placeholder="مثال: نور أحمد"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="رقم الهاتف *" error={errors.phone}>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="05xxxxxxxx"
                inputMode="tel"
              />
            </Field>
            <Field label="البريد الإلكتروني" error={errors.email}>
              <input
                className="input"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="email@example.com"
                inputMode="email"
              />
            </Field>
          </div>

          <Field label="عنوان التوصيل *" error={errors.address}>
            <textarea
              className="input min-h-24 resize-y"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              placeholder="المدينة، الحي، الشارع، رقم المبنى"
            />
          </Field>

          <Field label="ملاحظات إضافية (اختياري)">
            <textarea
              className="input min-h-20 resize-y"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="أي تفاصيل تودين إضافتها للطلب"
            />
          </Field>
        </div>

        <aside className="card h-fit space-y-4 p-6">
          <h2 className="text-lg font-bold">ملخص الطلب</h2>
          <div className="max-h-60 space-y-3 overflow-y-auto pl-1">
            {items.map((it) => (
              <div key={it.key} className="flex items-center gap-3">
                <img
                  src={it.image || '/favicon.svg'}
                  alt={it.name}
                  className="h-12 w-12 rounded-xl bg-blush-100 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.name}</p>
                  <p className="text-xs text-muted">
                    {it.quantity} × {money(it.price, settings.currency)}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {money(it.price * it.quantity, settings.currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-blush-100 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">المجموع الفرعي</span>
              <span>{money(subtotal, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">التوصيل</span>
              <span>{shipping === 0 ? 'مجاني' : money(shipping, settings.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-blush-100 pt-3 text-lg font-bold">
              <span>الإجمالي</span>
              <span className="text-brand">{money(total, settings.currency)}</span>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'جارٍ الإرسال...' : 'تأكيد الطلب'}
            {!submitting && <Icon.Check className="h-4 w-4" />}
          </button>
          <p className="text-center text-xs text-muted">
            بالضغط على التأكيد أنت توافقين على سياسة الطلب والتوصيل.
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}
