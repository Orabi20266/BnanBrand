import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';
import { Icon } from './Icons.jsx';

export default function Footer() {
  const { settings } = useSettings();
  const whatsappLink = settings.whatsapp
    ? `https://wa.me/${String(settings.whatsapp).replace(/[^\d]/g, '')}`
    : '#';

  return (
    <footer className="mt-20 border-t border-blush-100 bg-white">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blush-400 to-brand text-lg font-bold text-white">
              B
            </span>
            <span className="text-xl font-bold text-brand-dark">{settings.company_name}</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{settings.about_text}</p>
          <div className="mt-5 flex gap-3">
            {settings.whatsapp && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600"
                aria-label="واتساب"
              >
                <Icon.WhatsApp className="h-5 w-5" />
              </a>
            )}
            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="grid h-11 w-11 place-items-center rounded-full bg-blush-200 text-brand-dark transition hover:bg-blush-300"
                aria-label="هاتف"
              >
                📞
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-ink">روابط سريعة</h3>
          <ul className="space-y-2.5 text-sm text-muted">
            <li><Link to="/" className="hover:text-brand">الرئيسية</Link></li>
            <li><Link to="/categories" className="hover:text-brand">الأقسام</Link></li>
            <li><Link to="/products" className="hover:text-brand">كل المنتجات</Link></li>
            <li><Link to="/track" className="hover:text-brand">تتبع الطلب</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-ink">تواصل معنا</h3>
          <ul className="space-y-2.5 text-sm text-muted">
            {settings.phone && <li>📞 {settings.phone}</li>}
            {settings.company_email && <li>✉️ {settings.company_email}</li>}
            {settings.address && <li>📍 {settings.address}</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-blush-100 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} {settings.company_name} — جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
