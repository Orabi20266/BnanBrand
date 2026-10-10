import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { useSettings } from '../context/SettingsContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Loading from '../components/Loading.jsx';
import { Icon } from '../components/Icons.jsx';

const features = [
  { icon: Icon.Truck, title: 'توصيل سريع', text: 'لجميع المناطق' },
  { icon: Icon.Shield, title: 'دفع آمن', text: 'بياناتك محمية' },
  { icon: Icon.Gift, title: 'تغليف هدايا', text: 'مجاناً مع كل طلب' },
  { icon: Icon.Sparkle, title: 'جودة فاخرة', text: 'منتجات مختارة بعناية' },
];

export default function Home() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [search, setSearch] = useState('');

  const { data: catData } = useApi('/api/categories');
  const { data: featuredData, loading } = useApi('/api/products?featured=1&limit=8');
  const { data: latestData } = useApi('/api/products?limit=8&sort=newest');

  const categories = catData?.items || [];
  const featured = featuredData?.items || [];
  const latest = latestData?.items || [];

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(search.trim() ? `/products?search=${encodeURIComponent(search.trim())}` : '/products');
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blush-100 via-blush-50 to-white">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blush-200/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />

        <div className="container-x relative grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-fade-up">
            <span className="badge bg-white text-brand-dark shadow-card">
              <Icon.Sparkle className="ml-1 h-3.5 w-3.5" /> منتجات نسائية فاخرة
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-ink md:text-5xl">
              أناقة تُهدى،
              <br />
              <span className="text-brand">ولحظات لا تُنسى</span> 🌸
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
              {settings.about_text}
            </p>

            <form onSubmit={submitSearch} className="relative mt-8 max-w-md">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحثي عن إكسسوار، صندوق هدايا، عطر..."
                className="input py-4 pr-12 shadow-soft"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark"
                aria-label="بحث"
              >
                <Icon.Search className="h-5 w-5" />
              </button>
            </form>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/products" className="btn-primary">
                <Icon.Cart className="h-4 w-4" /> تصفّحي المنتجات
              </Link>
              <Link to="/categories" className="btn-outline">
                <Icon.Grid className="h-4 w-4" /> الأقسام
              </Link>
            </div>
          </div>

          <div className="relative animate-fade-up">
            <div className="animate-float overflow-hidden rounded-[2.5rem] border-8 border-white shadow-soft">
              <img
                src={featured[0]?.image || '/favicon.svg'}
                alt="BnanBrand"
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-2 card flex items-center gap-3 px-4 py-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <Icon.Check className="h-5 w-5" />
              </span>
              <div className="text-xs">
                <p className="font-bold text-ink">تسوّق آمن 100%</p>
                <p className="text-muted">الدفع عند الاستلام متاح</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-x -mt-6 md:-mt-10">
        <div className="card grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blush-100 text-brand">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">{f.title}</p>
                <p className="text-xs text-muted">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-x mt-16">
        <SectionHeader title="تسوّقي حسب القسم" subtitle="تشكيلات مختارة بعناية لكل مناسبة" to="/categories" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="group card overflow-hidden p-0 text-center transition hover:-translate-y-1 hover:shadow-soft"
            >
              <div className="aspect-[4/3] overflow-hidden bg-blush-100">
                <img
                  src={cat.image || '/favicon.svg'}
                  alt={cat.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold">{cat.name}</h3>
                <p className="text-xs text-muted">{cat.product_count} منتج</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-x mt-16">
        <SectionHeader title="منتجات مميزة" subtitle="الأكثر رواجاً هذا الأسبوع" to="/products?featured=1" />
        {loading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container-x mt-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-brand to-blush-400 p-8 text-center text-white md:p-12">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
          <h2 className="relative text-2xl font-bold md:text-3xl">هل تبحثين عن هدية مميزة؟</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm opacity-90">
            اكتشفي صناديق الهدايا الفاخرة والإكسسوارات الأنثوية، واتركي لنا الباقي.
          </p>
          <Link to="/products" className="btn mt-6 bg-white text-brand-dark hover:bg-blush-100">
            <Icon.Gift className="h-4 w-4" /> اكتشفي المزيد
          </Link>
        </div>
      </section>

      {/* Latest */}
      <section className="container-x mt-16">
        <SectionHeader title="وصل حديثاً" subtitle="أحدث ما أضفناه للمتجر" to="/products" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {latest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, subtitle, to }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark">
          عرض الكل <Icon.ArrowLeft className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
