import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Icon } from '../../components/Icons.jsx';

export default function AdminLogin() {
  const { login, user } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/';

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username.trim(), password);
      show('مرحباً بك في لوحة التحكم');
      navigate(from, { replace: true });
    } catch (err) {
      show(err.message || 'فشل تسجيل الدخول', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-blush-100 via-blush-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-blush-400 to-brand text-2xl font-bold text-white shadow-soft">
            B
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink">لوحة تحكم BnanBrand</h1>
          <p className="mt-1 text-sm text-muted">سجّلي الدخول لإدارة المتجر</p>
        </div>

        <form onSubmit={submit} className="card space-y-5 p-7">
          <div>
            <label className="label">اسم المستخدم</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Bnan1"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
            {!loading && <Icon.Shield className="h-4 w-4" />}
          </button>
          <p className="rounded-2xl bg-blush-50 p-3 text-center text-xs text-muted">
            الافتراضي: <strong>Bnan1</strong> / <strong>Bnan1234</strong> — غيّريها فوراً من الإعدادات.
          </p>
        </form>

        <p className="mt-5 text-center text-sm">
          <Link to="/" className="text-brand hover:underline">← العودة إلى المتجر</Link>
        </p>
      </div>
    </div>
  );
}
