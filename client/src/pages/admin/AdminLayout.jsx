import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Icon } from '../../components/Icons.jsx';

const navItems = [
  { to: '/', label: 'لوحة المعلومات', icon: Icon.Chart, end: true },
  { to: '/products', label: 'المنتجات', icon: Icon.Box },
  { to: '/categories', label: 'الأقسام', icon: Icon.Grid },
  { to: '/orders', label: 'الطلبات', icon: Icon.Receipt },
  { to: '/settings', label: 'الإعدادات', icon: Icon.Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
      isActive ? 'bg-brand text-white shadow-soft' : 'text-ink hover:bg-blush-100'
    }`;

  const Sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/" className="mb-6 flex items-center gap-2 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blush-400 to-brand text-lg font-bold text-white">
          B
        </span>
        <div>
          <p className="text-sm font-bold text-ink">BnanBrand</p>
          <p className="text-xs text-muted">لوحة التحكم</p>
        </div>
      </Link>

      <nav className="flex flex-col gap-1.5">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={() => setOpen(false)}>
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3 border-t border-blush-100 pt-4">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-blush-100 text-brand">
            <Icon.User className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.full_name || user?.username}</p>
            <p className="text-xs text-muted">مدير المتجر</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-outline w-full py-2.5 text-xs">
          <Icon.Logout className="h-4 w-4" /> تسجيل الخروج
        </button>
        <Link to="/" className="block text-center text-xs text-muted hover:text-brand">
          عرض المتجر ←
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-blush-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 right-0 hidden w-64 border-l border-blush-100 bg-white p-5 lg:block">
        {Sidebar}
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 right-0 z-50 w-64 border-l border-blush-100 bg-white p-5 lg:hidden">
            {Sidebar}
          </aside>
        </>
      )}

      <div className="lg:mr-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-blush-100 bg-white/90 px-4 backdrop-blur lg:px-8">
          <button
            onClick={() => setOpen(true)}
            className="rounded-full p-2 hover:bg-blush-100 lg:hidden"
            aria-label="القائمة"
          >
            <Icon.Menu className="h-6 w-6" />
          </button>
          <h1 className="font-bold text-ink">إدارة المتجر</h1>
        </header>

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
