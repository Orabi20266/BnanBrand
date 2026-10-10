import { useState } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Icon } from '../components/Icons.jsx';

export default function Contact() {
  const { settings } = useSettings();
  const { show } = useToast();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      show('يرجى إدخال الاسم والرسالة', 'error');
      return;
    }
    const digits = String(settings.whatsapp || '').replace(/[^\d]/g, '');
    if (digits) {
      const text = encodeURIComponent(
        `مرحباً ${settings.company_name} 🌸\nالاسم: ${form.name}\nالهاتف: ${form.phone}\nالرسالة: ${form.message}`
      );
      window.open(`https://wa.me/${digits}?text=${text}`, '_blank');
      show('تم فتح واتساب لإرسال رسالتك');
    } else {
      show('تم استلام رسالتك، سنتواصل معك قريباً');
    }
    setForm({ name: '', phone: '', message: '' });
  };

  return (
    <div className="container-x py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-ink">تواصلي معنا</h1>
        <p className="mt-2 text-sm text-muted">نحن هنا للإجابة على استفساراتك ومساعدتك في اختيار الأفضل</p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          {[
            { icon: '📞', label: 'الهاتف', value: settings.phone || '—' },
            { icon: '✉️', label: 'البريد الإلكتروني', value: settings.company_email || '—' },
            { icon: '📍', label: 'العنوان', value: settings.address || '—' },
          ].map((c) => (
            <div key={c.label} className="card flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blush-100 text-xl">{c.icon}</span>
              <div>
                <p className="text-xs text-muted">{c.label}</p>
                <p className="font-semibold">{c.value}</p>
              </div>
            </div>
          ))}

          {settings.whatsapp && (
            <a
              href={`https://wa.me/${String(settings.whatsapp).replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn bg-emerald-500 text-white hover:bg-emerald-600 w-full"
            >
              <Icon.WhatsApp className="h-5 w-5" /> تواصلي عبر واتساب
            </a>
          )}
        </div>

        <form onSubmit={submit} className="card space-y-5 p-6">
          <h2 className="text-lg font-bold">أرسلي رسالة</h2>
          <div>
            <label className="label">الاسم</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="اسمك الكريم"
            />
          </div>
          <div>
            <label className="label">رقم الهاتف</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="05xxxxxxxx"
              inputMode="tel"
            />
          </div>
          <div>
            <label className="label">الرسالة</label>
            <textarea
              className="input min-h-32 resize-y"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="كيف يمكننا مساعدتك؟"
            />
          </div>
          <button type="submit" className="btn-primary w-full">إرسال الرسالة</button>
        </form>
      </div>
    </div>
  );
}
