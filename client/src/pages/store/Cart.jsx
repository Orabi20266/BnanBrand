import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { money } from '../api.js';
import { EmptyState } from '../components/Loading.jsx';
import { Icon } from '../components/Icons.jsx';

export default function Cart() {
  const { items, subtotal, updateQuantity, remove } = useCart();
  const { settings } = useSettings();

  const freeThreshold = settings.free_shipping_threshold || 0;
  const remaining = Math.max(0, freeThreshold - subtotal);

  if (items.length === 0) {
    return (
      <div className="container-x py-16">
        <EmptyState title="سلة التسوق فارغة">
          <Link to="/products" className="btn-primary">ابدئي التسوق</Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-bold text-ink">سلة التسوق</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.key} className="card flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
              <img
                src={it.image || '/favicon.svg'}
                alt={it.name}
                className="h-24 w-24 shrink-0 rounded-2xl bg-blush-100 object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{it.name}</h3>
                {it.variant && <p className="text-xs text-muted">{it.variant}</p>}
                <p className="mt-1 text-sm font-bold text-brand">{money(it.price, settings.currency)}</p>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-blush-200 px-2 py-1">
                <button
                  onClick={() => updateQuantity(it.key, it.quantity - 1)}
                  className="rounded-full p-1.5 hover:bg-blush-100"
                >
                  <Icon.Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold">{it.quantity}</span>
                <button
                  onClick={() => updateQuantity(it.key, it.quantity + 1)}
                  className="rounded-full p-1.5 hover:bg-blush-100"
                >
                  <Icon.Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="text-right">
                <p className="font-bold text-ink">{money(it.price * it.quantity, settings.currency)}</p>
                <button
                  onClick={() => remove(it.key)}
                  className="mt-1 text-xs text-rose-500 hover:underline"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="card h-fit space-y-4 p-6">
          <h2 className="text-lg font-bold">ملخص الطلب</h2>

          {freeThreshold > 0 && (
            <div className="rounded-2xl bg-blush-50 p-3 text-xs text-muted">
              {remaining > 0 ? (
                <>أضيفي منتجات بقيمة <strong className="text-brand">{money(remaining, settings.currency)}</strong> للحصول على توصيل مجاني 🚚</>
              ) : (
                <span className="font-semibold text-emerald-600">🎉 حصلتِ على توصيل مجاني!</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">المجموع الفرعي</span>
            <span className="font-semibold">{money(subtotal, settings.currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">التوصيل</span>
            <span className="font-semibold">
              {freeThreshold > 0 && subtotal >= freeThreshold ? 'مجاني' : money(settings.shipping_fee, settings.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-blush-100 pt-4 text-lg">
            <span className="font-bold">الإجمالي</span>
            <span className="font-bold text-brand">
              {money(
                subtotal + (freeThreshold > 0 && subtotal >= freeThreshold ? 0 : settings.shipping_fee),
                settings.currency
              )}
            </span>
          </div>

          <Link to="/checkout" className="btn-primary w-full">
            متابعة الطلب <Icon.ArrowLeft className="h-4 w-4" />
          </Link>
          <Link to="/products" className="btn-ghost w-full">مواصلة التسوق</Link>
        </aside>
      </div>
    </div>
  );
}
