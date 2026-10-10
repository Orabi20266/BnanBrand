import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, money, STATUS_LABELS, STATUS_STYLES } from '../../api.js';
import Loading from '../../components/Loading.jsx';
import { Icon } from '../../components/Icons.jsx';

const STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { data, loading, reload } = useApi(`/api/admin/orders/${id}`);
  const { settings } = useSettings();
  const { show } = useToast();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);

  if (loading) return <Loading />;

  const order = data?.order;
  if (!order) return <div className="card p-10 text-center">الطلب غير موجود.</div>;

  const changeStatus = async (status) => {
    setUpdating(true);
    try {
      await api.put(`/api/admin/orders/${order.id}/status`, { status });
      show('تم تحديث حالة الطلب');
      reload();
    } catch (e) {
      show(e.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const removeOrder = async () => {
    if (!window.confirm(`حذف الطلب ${order.order_number} نهائياً؟`)) return;
    try {
      await api.del(`/api/admin/orders/${order.id}`);
      show('تم حذف الطلب');
      navigate('/orders');
    } catch (e) {
      show(e.message, 'error');
    }
  };

  const print = () => window.print();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/orders" className="text-sm text-muted hover:text-brand">← الطلبات</Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-xl font-bold">{order.order_number}</h1>
            <span className={`badge ${STATUS_STYLES[order.status]}`}>{STATUS_LABELS[order.status]}</span>
          </div>
          <p className="text-xs text-muted">{new Date(order.created_at).toLocaleString('ar')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={print} className="btn-ghost py-2.5 text-xs">
            <Icon.Receipt className="h-4 w-4" /> طباعة
          </button>
          <button onClick={removeOrder} className="btn py-2.5 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100">
            <Icon.Trash className="h-4 w-4" /> حذف
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-bold">حالة الطلب</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              disabled={updating}
              onClick={() => changeStatus(s)}
              className={`chip ${order.status === s ? 'chip-active' : ''}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-4 font-bold">محتوى الطلب</h2>
          <div className="space-y-3">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-3 border-b border-blush-50 pb-3 last:border-0">
                <div>
                  <p className="font-medium">{it.product_name}</p>
                  {it.variant && <p className="text-xs text-muted">{it.variant}</p>}
                  <p className="text-xs text-muted">{it.quantity} × {money(it.unit_price, settings.currency)}</p>
                </div>
                <span className="font-semibold">{money(it.line_total, settings.currency)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-blush-100 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted">المجموع الفرعي</span><span>{money(order.subtotal, settings.currency)}</span></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-brand"><span>الخصم</span><span>- {money(order.discount, settings.currency)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted">التوصيل</span><span>{order.shipping > 0 ? money(order.shipping, settings.currency) : 'مجاني'}</span></div>
            <div className="flex justify-between border-t border-blush-100 pt-3 text-lg font-bold">
              <span>الإجمالي</span><span className="text-brand">{money(order.total, settings.currency)}</span>
            </div>
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-bold">بيانات الزبون</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted">الاسم:</span> {order.customer_name}</p>
            <p><span className="text-muted">الهاتف:</span> <a href={`tel:${order.phone}`} className="text-brand">{order.phone}</a></p>
            {order.email && <p><span className="text-muted">البريد:</span> {order.email}</p>}
            <p><span className="text-muted">العنوان:</span> {order.address}</p>
            {order.notes && <p><span className="text-muted">ملاحظات:</span> {order.notes}</p>}
          </div>
          <div className="flex gap-2 pt-2">
            <a
              href={`https://wa.me/${String(order.phone).replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn bg-emerald-500 text-white hover:bg-emerald-600 flex-1 py-2.5 text-xs"
            >
              <Icon.WhatsApp className="h-4 w-4" /> واتساب
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
