import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { Icon } from './Icons.jsx';

export default function Layout() {
  const { settings } = useSettings();
  const whatsappLink = settings.whatsapp
    ? `https://wa.me/${String(settings.whatsapp).replace(/[^\d]/g, '')}`
    : '';

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 left-6 z-30 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-soft transition hover:scale-105 hover:bg-emerald-600"
          aria-label="تواصل عبر واتساب"
        >
          <Icon.WhatsApp className="h-7 w-7" />
        </a>
      )}
    </div>
  );
}
