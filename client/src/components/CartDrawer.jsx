import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { money } from '../api.js';
import { Icon } from './Icons.jsx';

export default function CartDrawer({ open, onClose }) {
  const { items, subtotal, count, updateQuantity, remove } = useCart();
  const { settings } = useSettings();

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-blush-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-brand-dark">
            <Icon.Cart className="h-5 w-5" /> سلة التسوق
            {count > 0 && <span className="badge bg-blush-200 text-brand-dark">{count}</span>}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-blush-100" aria-label="إغلاق">
            <Icon.Close className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-blush-100 text-brand">
              <Icon.Cart className="h-9 w-9" />
            </div>
            <p className="text-muted">سلتك فارغة حالياً</p>
            <Link to="/products" onClick={onClose} className="btn-primary">
              تسوّقي الآن
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {items.map((it) => (
                <div key={it.key} className="flex gap-3 rounded-2xl border border-blush-100 p-3">
                  <img
                    src={it.image || '/favicon.svg'}
                    alt={it.name}
                    className="h-20 w-20 shrink-0 rounded-xl bg-blush-100 object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold">{it.name}</h3>
                      <button
                        onClick={() => remove(it.key)}
                        className="rounded-full p-1 text-muted hover:bg-rose-50 hover:text-rose-500"
                        aria-label="حذف"
                      >
                        <Icon.Trash className="h-4 w-4" />
                      </button>
                    </div>
                    {it.variant && <p className="mt-0.5 text-xs text-muted">{it.variant}</p>}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-blush-200 px-2 py-1">
                        <button
                          onClick={() => updateQuantity(it.key, it.quantity - 1)}
                          className="rounded-full p-1 hover:bg-blush-100"
                        >
                          <Icon.Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{it.quantity}</span>
                        <button
                          onClick={() => updateQuantity(it.key, it.quantity + 1)}
                          className="rounded-full p-1 hover:bg-blush-100"
                        >
                          <Icon.Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-brand">
                        {money(it.price * it.quantity, settings.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="space-y-3 border-t border-blush-100 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">المجموع الفرعي</span>
                <span className="text-lg font-bold text-brand">{money(subtotal, settings.currency)}</span>
              </div>
              <Link to="/checkout" onClick={onClose} className="btn-primary w-full">
                <Icon.Check className="h-4 w-4" /> إتمام الطلب
              </Link>
              <Link to="/cart" onClick={onClose} className="btn-outline w-full">
                عرض السلة
              </Link>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
