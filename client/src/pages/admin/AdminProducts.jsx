import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, money } from '../../api.js';
import Loading from '../../components/Loading.jsx';
import { Icon } from '../../components/Icons.jsx';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const { data, loading, reload } = useApi(`/api/admin/products?search=${encodeURIComponent(search)}`);
  const { settings } = useSettings();
  const { show } = useToast();

  const products = data?.items || [];

  const remove = async (p) => {
    if (!window.confirm(`هل تريدين حذف "${p.name}"؟`)) return;
    try {
      await api.del(`/api/admin/products/${p.id}`);
      show('تم حذف المنتج');
      reload();
    } catch (e) {
      show(e.message, 'error');
    }
  };

  const toggle = async (p, field) => {
    try {
      await api.put(`/api/admin/products/${p.id}`, { [field]: p[field] ? 0 : 1 });
      reload();
    } catch (e) {
      show(e.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">المنتجات</h1>
          <p className="text-sm text-muted">{products.length} منتج</p>
        </div>
        <Link to="/products/new" className="btn-primary py-2.5 text-xs">
          <Icon.Plus className="h-4 w-4" /> إضافة منتج
        </Link>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setSearch(term); }}
        className="relative max-w-md"
      >
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحثي في المنتجات..."
          className="input py-3 pr-11"
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="بحث">
          <Icon.Search className="h-5 w-5" />
        </button>
      </form>

      {loading ? (
        <Loading />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-blush-50 text-right text-xs text-muted">
                <tr>
                  <th className="p-4 font-medium">المنتج</th>
                  <th className="p-4 font-medium">القسم</th>
                  <th className="p-4 font-medium">السعر</th>
                  <th className="p-4 font-medium">المخزون</th>
                  <th className="p-4 font-medium">مميز</th>
                  <th className="p-4 font-medium">نشط</th>
                  <th className="p-4 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-blush-50 hover:bg-blush-50/40">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image || '/favicon.svg'} alt="" className="h-12 w-12 rounded-xl bg-blush-100 object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{p.name}</p>
                          <p className="truncate text-xs text-muted">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted">{p.category_name || '—'}</td>
                    <td className="p-4">
                      <div className="font-semibold text-brand">
                        {money(p.has_discount ? p.discount_price : p.price, settings.currency)}
                      </div>
                      {p.has_discount && (
                        <div className="text-xs text-muted line-through">{money(p.price, settings.currency)}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`badge ${p.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => toggle(p, 'is_featured')} className="text-xl" title="تبديل مميز">
                        {p.is_featured ? '⭐' : '☆'}
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggle(p, 'is_active')}
                        className={`badge ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {p.is_active ? 'نشط' : 'مخفي'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link to={`/products/${p.id}/edit`} className="rounded-full bg-blush-100 p-2 text-brand hover:bg-blush-200" title="تعديل">
                          <Icon.Edit className="h-4 w-4" />
                        </Link>
                        <button onClick={() => remove(p)} className="rounded-full bg-rose-50 p-2 text-rose-500 hover:bg-rose-100" title="حذف">
                          <Icon.Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {products.length === 0 && <p className="py-10 text-center text-sm text-muted">لا توجد منتجات مطابقة.</p>}
        </div>
      )}
    </div>
  );
}
