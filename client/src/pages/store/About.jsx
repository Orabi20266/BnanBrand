import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';
import { Icon } from '../components/Icons.jsx';

const values = [
  { icon: Icon.Sparkle, title: 'الأناقة', text: 'كل قطعة تُختار بعناية لتعكس ذوقاً أنثوياً راقياً.' },
  { icon: Icon.Shield, title: 'الثقة', text: 'تجربة تسوق آمنة وشفافة من الطلب حتى التوصيل.' },
  { icon: Icon.Gift, title: 'اللمسة الخاصة', text: 'تغليف وإهداء يجعلان كل مناسبة استثنائية.' },
  { icon: Icon.Heart, title: 'الاهتمام', text: 'نستمع لملاحظاتك ونطوّر تجربتك باستمرار.' },
];

const stats = [
  { value: '٤٢٠٠+', label: 'عميلة سعيدة' },
  { value: '٣٠٠+', label: 'منتج مميز' },
  { value: '٩٨٪', label: 'رضا العملاء' },
  { value: '٢٤/٧', label: 'دعم متواصل' },
];

export default function About() {
  const { settings } = useSettings();
  return (
    <div>
      <section className="bg-gradient-to-l from-blush-100 to-white py-16">
        <div className="container-x text-center">
          <span className="badge bg-white text-brand-dark shadow-card">قصتنا</span>
          <h1 className="mt-4 text-4xl font-bold text-ink">عن {settings.company_name}</h1>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted">{settings.about_text}</p>
        </div>
      </section>

      <section className="container-x grid gap-6 py-14 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-6 text-center">
            <p className="text-3xl font-bold text-brand">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="container-x pb-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-ink">قيمنا</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="card p-6 text-center">
              <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-blush-100 text-brand">
                <v.icon className="h-6 w-6" />
              </span>
              <h3 className="font-bold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x pb-16">
        <div className="rounded-[2rem] bg-gradient-to-l from-brand to-blush-400 p-10 text-center text-white">
          <h2 className="text-2xl font-bold">جاهزة لاكتشاف تشكيلتنا؟</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm opacity-90">
            تصفّحي الأقسام واختاري ما يلامس ذوقك.
          </p>
          <Link to="/products" className="btn mt-6 bg-white text-brand-dark hover:bg-blush-100">
            <Icon.Cart className="h-4 w-4" /> تسوّقي الآن
          </Link>
        </div>
      </section>
    </div>
  );
}
