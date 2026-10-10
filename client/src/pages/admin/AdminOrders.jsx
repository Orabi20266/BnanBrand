import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { money, STATUS_LABELS, STATUS_STYLES } from '../../api.js';
import Loading from '../../components/Loading.jsx';
import { Icon } from '../../components/Icons.jsx';

const STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [status, setStatus] = useState('');
  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');
  const { settings } = useSettings();

  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (search) query.set('search', search);
  const { data, loading } = useApi(`/api/admin/orders?${query.toString()}`);
  const orders = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">الطلبات</h1>
          <p className="text-sm text-muted">{orders.length} طلب</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(term); }}
          className="relative w-full max-w-xs"
        >
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="رقم الطلب / الاسم / الهاتف"
            className="input py-2.5 pr-10 text-sm"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="بحث">
            <Icon.Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStatus('')} className={`chip ${!status ? 'chip-active' : ''}`}>الكل</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`chip ${status === s ? 'chip-active' : ''}`}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">لا توجد طلبات مطابقة.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-blush-50 text-right text-xs text-muted">
                <tr>
                  <th className="p-4 font-medium">رقم الطلب</th>
                  <th className="p-4 font-medium">الزبون</th>
                  <th className="p-4 font-medium">الهاتف</th>
                  <th className="p-4 font-medium">الأصناف</th>
                  <th className="p-4 font-medium">الإجمالي</th>
                  <th className="p-4 font-medium">الحالة</th>
                  <th className="p-4 font-medium">التاريخ</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-blush-50 hover:bg-blush-50/40">
                    <td className="p-4 font-semibold text-brand">{o.order_number}</td>
                    <td className="p-4">{o.customer_name}</td>
                    <td className="p-4 text-muted" dir="ltr">{o.phone}</td>
                    <td className="p-4">{o.items_count || 0}</td>
                    <td className="p-4 font-semibold">{money(o.total, settings.currency)}</td>
                    <td className="p-4">
                      <span className={`badge ${STATUS_STYLES[o.status] || 'bg-blush-200'}`}>
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted">
                      {new Date(o.created_at).toLocaleDateString('ar')}
                    </td>
                    <td className="p-4">
                      <Link to={`/orders/${o.id}`} className="btn-soft py-1.5 px-3 text-xs">تفاصيل</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
