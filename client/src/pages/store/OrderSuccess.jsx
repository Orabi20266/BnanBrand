import { Link, useParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { money, STATUS_LABELS, STATUS_STYLES } from '../api.js';
import Loading from '../components/Loading.jsx';
import { Icon } from '../components/Icons.jsx';

export function OrderDetails({ order }) {
  const { settings } = useSettings();
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted">رقم الطلب</p>
            <p className="text-xl font-bold text-brand">{order.order_number}</p>
          </div>
          <span className={`badge ${STATUS_STYLES[order.status] || 'bg-blush-200'}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>

        <div className="space-y-3">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-3 border-b border-blush-50 pb-3 last:border-0">
              <div>
                <p className="text-sm font-medium">{it.product_name}</p>
                {it.variant && <p className="text-xs text-muted">{it.variant}</p>}
                <p className="text-xs text-muted">
                  {it.quantity} × {money(it.unit_price, settings.currency)}
                </p>
              </div>
              <span className="font-semibold">{money(it.line_total, settings.currency)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-blush-100 pt-4 text-sm">
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

      <div className="card p-6">
        <h3 className="mb-3 font-bold">بيانات التوصيل</h3>
        <div className="space-y-1 text-sm text-muted">
          <p>👤 {order.customer_name}</p>
          <p>📞 {order.phone}</p>
          {order.email && <p>✉️ {order.email}</p>}
          <p>📍 {order.address}</p>
          {order.notes && <p>📝 {order.notes}</p>}
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const { data, loading, error } = useApi(`/api/orders/track/${orderNumber}`);

  if (loading) return <Loading />;

  if (error || !data?.order) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-2xl font-bold">تعذّر العثور على الطلب</h1>
        <Link to="/" className="btn-primary mt-6 inline-flex">العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div className="container-x max-w-3xl py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <Icon.Check className="h-10 w-10" />
        </div>
        <h1 className="mt-4 text-3xl font-bold text-ink">تم تأكيد طلبك بنجاح 🌸</h1>
        <p className="mt-2 text-muted">
          شكراً لك! سيتم التواصل معك قريباً لتأكيد التوصيل. تم إرسال تفاصيل الطلب إلى بريدك الإلكتروني.
        </p>
      </div>

      <OrderDetails order={data.order} />

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to={`/track/${data.order.order_number}`} className="btn-soft">
          <Icon.Truck className="h-4 w-4" /> تتبع الطلب
        </Link>
        <Link to="/products" className="btn-outline">مواصلة التسوق</Link>
      </div>
    </div>
  );
}
