import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { money, STATUS_LABELS, STATUS_STYLES } from '../../api.js';
import Loading from '../../components/Loading.jsx';
import { Icon } from '../../components/Icons.jsx';

export default function Dashboard() {
  const { data, loading } = useApi('/api/admin/stats');
  const { settings } = useSettings();

  if (loading) return <Loading />;

  const stats = data?.stats || {};
  const cards = [
    { label: 'إجمالي الإيرادات', value: money(stats.revenue, settings.currency), icon: Icon.Chart, tone: 'bg-emerald-100 text-emerald-600' },
    { label: 'الطلبات', value: stats.orders ?? 0, icon: Icon.Receipt, tone: 'bg-sky-100 text-sky-600', sub: `${stats.newOrders ?? 0} جديد` },
    { label: 'المنتجات', value: stats.products ?? 0, icon: Icon.Box, tone: 'bg-blush-100 text-brand' },
    { label: 'العملاء', value: stats.customers ?? 0, icon: Icon.User, tone: 'bg-violet-100 text-violet-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${c.tone}`}>
                <c.icon className="h-6 w-6" />
              </span>
              {c.sub && <span className="badge bg-blush-100 text-brand-dark">{c.sub}</span>}
            </div>
            <p className="mt-4 text-2xl font-bold text-ink">{c.value}</p>
            <p className="text-sm text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">أحدث الطلبات</h2>
            <Link to="/orders" className="text-sm font-semibold text-brand hover:underline">عرض الكل</Link>
          </div>

          {data?.recentOrders?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-xs text-muted">
                    <th className="pb-3 font-medium">رقم الطلب</th>
                    <th className="pb-3 font-medium">الزبون</th>
                    <th className="pb-3 font-medium">الإجمالي</th>
                    <th className="pb-3 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-blush-50">
                      <td className="py-3">
                        <Link to={`/orders/${o.id}`} className="font-semibold text-brand hover:underline">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="py-3">{o.customer_name}</td>
                      <td className="py-3 font-semibold">{money(o.total, settings.currency)}</td>
                      <td className="py-3">
                        <span className={`badge ${STATUS_STYLES[o.status] || 'bg-blush-200'}`}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted">لا توجد طلبات بعد.</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-bold">الأكثر مبيعاً</h2>
          {data?.topProducts?.length ? (
            <ul className="space-y-3">
              {data.topProducts.map((p, i) => (
                <li key={p.product_name} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blush-100 text-xs font-bold text-brand">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.product_name}</p>
                    <p className="text-xs text-muted">{p.sold} مبيع</p>
                  </div>
                  <span className="text-xs font-semibold text-brand">{money(p.revenue, settings.currency)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted">لا توجد مبيعات بعد.</p>
          )}
        </div>
      </div>
    </div>
  );
}
