import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { Icon } from './Icons.jsx';
import CartDrawer from './CartDrawer.jsx';

const links = [
  { to: '/', label: 'الرئيسية', end: true },
  { to: '/categories', label: 'الأقسام' },
  { to: '/products', label: 'كل المنتجات' },
  { to: '/track', label: 'تتبع الطلب' },
  { to: '/contact', label: 'تواصل معنا' },
];

export default function Navbar() {
  const { count } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');

  const submitSearch = (e) => {
    e.preventDefault();
    const term = search.trim();
    setOpen(false);
    navigate(term ? `/products?search=${encodeURIComponent(term)}` : '/products');
  };

  const navClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      isActive ? 'bg-blush-100 text-brand-dark' : 'text-ink hover:bg-blush-100'
    }`;

  return (
    <>
      <div className="bg-gradient-to-l from-brand to-blush-400 py-1.5 text-center text-xs font-medium text-white">
        🌸 توصيل لجميع المناطق • الدفع عند الاستلام متاح • تغليف هدايا مجاني
      </div>

      <header className="sticky top-0 z-30 border-b border-blush-100 bg-white/90 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <button
            className="rounded-full p-2 hover:bg-blush-100 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
          >
            {open ? <Icon.Close className="h-6 w-6" /> : <Icon.Menu className="h-6 w-6" />}
          </button>

          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blush-400 to-brand text-lg font-bold text-white shadow-soft">
              B
            </span>
            <span className="text-xl font-bold tracking-wide text-brand-dark">
              {settings.company_name}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="relative hidden max-w-xs flex-1 md:block">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحثي عن منتج..."
              className="input py-2.5 pr-11"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-brand"
              aria-label="بحث"
            >
              <Icon.Search className="h-5 w-5" />
            </button>
          </form>

          <div className="flex items-center gap-1">
            <Link
              to={user ? '/admin' : '/admin/login'}
              className="hidden rounded-full p-2.5 hover:bg-blush-100 sm:block"
              title={user ? 'لوحة التحكم' : 'دخول الأدمن'}
            >
              <Icon.User className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2.5 hover:bg-blush-100"
              aria-label="السلة"
            >
              <Icon.Cart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -left-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-blush-100 bg-white p-4 lg:hidden">
            <form onSubmit={submitSearch} className="relative mb-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحثي عن منتج..."
                className="input py-2.5 pr-11"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                <Icon.Search className="h-5 w-5" />
              </button>
            </form>
            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 text-sm font-medium ${
                      isActive ? 'bg-blush-100 text-brand-dark' : 'hover:bg-blush-50'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <Link
                to={user ? '/admin' : '/admin/login'}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm font-medium hover:bg-blush-50"
              >
                {user ? 'لوحة التحكم' : 'دخول الأدمن'}
              </Link>
            </nav>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
