import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { api, STATUS_LABELS } from '../api.js';
import Loading from '../components/Loading.jsx';
import { Icon } from '../components/Icons.jsx';

const STEPS = ['new', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function TrackOrder() {
  const { orderNumber: paramNumber } = useParams();
  const navigate = useNavigate();
  const [value, setValue] = useState(paramNumber || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async (num) => {
    const clean = String(num).trim();
    if (!clean) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const data = await api.get(`/api/orders/track/${encodeURIComponent(clean)}`);
      setOrder(data.order);
    } catch (e) {
      setError(e.message || 'لم يتم العثور على الطلب');
    } finally {
      setLoading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const clean = value.trim();
    if (clean) navigate(`/track/${encodeURIComponent(clean)}`, { replace: true });
    lookup(clean);
  };

  const currentStep = order ? STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'cancelled';

  return (
    <div className="container-x max-w-2xl py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-ink">تتبع طلبك</h1>
        <p className="mt-2 text-sm text-muted">أدخلي رقم الطلب لمعرفة حالته</p>
      </header>

      <form onSubmit={submit} className="flex gap-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="مثال: BN-260101-1234"
          className="input py-3.5"
        />
        <button type="submit" className="btn-primary shrink-0">
          <Icon.Search className="h-5 w-5" /> تتبع
        </button>
      </form>

      {loading && <Loading />}

      {error && !loading && (
        <div className="card mt-6 p-6 text-center text-rose-500">
          <p className="font-semibold">{error}</p>
          <p className="mt-1 text-xs text-muted">تأكدي من كتابة رقم الطلب بشكل صحيح.</p>
        </div>
      )}

      {order && !loading && (
        <div className="mt-8 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">رقم الطلب</p>
                <p className="text-xl font-bold text-brand">{order.order_number}</p>
              </div>
              <div className="text-left text-sm text-muted">
                <p>{order.customer_name}</p>
                <p>{new Date(order.created_at).toLocaleString('ar')}</p>
              </div>
            </div>

            {isCancelled ? (
              <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-center font-semibold text-rose-600">
                تم إلغاء هذا الطلب
              </div>
            ) : (
              <div className="mt-8">
                <div className="relative flex justify-between">
                  <div className="absolute left-0 right-0 top-5 -z-0 h-1 rounded bg-blush-100" />
                  <div
                    className="absolute right-0 top-5 -z-0 h-1 rounded bg-brand transition-all"
                    style={{ width: `${(Math.max(currentStep, 0) / (STEPS.length - 1)) * 100}%` }}
                  />
                  {STEPS.map((step, i) => (
                    <div key={step} className="relative z-10 flex flex-1 flex-col items-center gap-2">
                      <div
                        className={`grid h-10 w-10 place-items-center rounded-full border-2 ${
                          i <= currentStep
                            ? 'border-brand bg-brand text-white'
                            : 'border-blush-200 bg-white text-muted'
                        }`}
                      >
                        {i <= currentStep ? <Icon.Check className="h-5 w-5" /> : i + 1}
                      </div>
                      <span className={`text-center text-xs font-medium ${i <= currentStep ? 'text-brand-dark' : 'text-muted'}`}>
                        {STATUS_LABELS[step]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card divide-y divide-blush-50 p-6">
            <h3 className="pb-4 font-bold">محتوى الطلب</h3>
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between py-3 text-sm">
                <span>
                  {it.product_name}
                  {it.variant && <span className="text-muted"> ({it.variant})</span>}
                  <span className="text-muted"> × {it.quantity}</span>
                </span>
                <span className="font-semibold">{it.line_total.toFixed(2)} ₪</span>
              </div>
            ))}
            <div className="flex justify-between pt-4 text-lg font-bold">
              <span>الإجمالي</span>
              <span className="text-brand">{order.total.toFixed(2)} ₪</span>
            </div>
          </div>

          <div className="text-center">
            <Link to="/products" className="btn-outline">مواصلة التسوق</Link>
          </div>
        </div>
      )}
    </div>
  );
}
