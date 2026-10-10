import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import Loading from '../components/Loading.jsx';
import { Icon } from '../components/Icons.jsx';

export default function Categories() {
  const { data, loading } = useApi('/api/categories');
  const categories = data?.items || [];

  return (
    <div className="container-x py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-ink">أقسام المتجر</h1>
        <p className="mt-2 text-sm text-muted">تصفّحي تشكيلاتنا المتنوعة واختاري ما يناسبك</p>
      </header>

      {loading ? (
        <Loading />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="group card flex overflow-hidden transition hover:-translate-y-1 hover:shadow-soft"
            >
              <div className="h-36 w-36 shrink-0 overflow-hidden bg-blush-100">
                <img
                  src={cat.image || '/favicon.svg'}
                  alt={cat.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center p-5">
                <h2 className="text-lg font-bold group-hover:text-brand">{cat.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{cat.description}</p>
                <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand">
                  {cat.product_count} منتج
                  <Icon.ArrowLeft className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
