import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import ProductCard from '../components/ProductCard.jsx';
import Loading, { EmptyState } from '../components/Loading.jsx';
import { Icon } from '../components/Icons.jsx';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const { data: catData } = useApi('/api/categories');
  const categories = catData?.items || [];

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const featured = params.get('featured') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page') || 1);

  const [term, setTerm] = useState(search);
  useEffect(() => setTerm(search), [search]);

  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (category) query.set('category', category);
  if (featured) query.set('featured', featured);
  query.set('sort', sort);
  query.set('page', String(page));
  query.set('limit', '12');

  const { data, loading } = useApi(`/api/products?${query.toString()}`);
  const products = data?.items || [];
  const pages = data?.pages || 1;

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    update('search', term.trim());
  };

  return (
    <div className="container-x py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-ink">
          {search ? `نتائج البحث: "${search}"` : featured ? 'المنتجات المميزة' : 'كل المنتجات'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {loading ? 'جارٍ التحميل...' : `${data?.total || 0} منتج متاح`}
        </p>
      </header>

      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <form onSubmit={submitSearch} className="relative">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="ابحثي عن منتج..."
            className="input py-3 pr-11"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-brand"
            aria-label="بحث"
          >
            <Icon.Search className="h-5 w-5" />
          </button>
        </form>
        <select
          value={sort}
          onChange={(e) => update('sort', e.target.value)}
          className="input py-3 md:w-52"
        >
          <option value="newest">الأحدث</option>
          <option value="price-asc">السعر: من الأقل للأعلى</option>
          <option value="price-desc">السعر: من الأعلى للأقل</option>
          <option value="name">الاسم</option>
        </select>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => update('category', '')}
          className={`chip ${!category ? 'chip-active' : ''}`}
        >
          الكل
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => update('category', cat.slug)}
            className={`chip ${category === cat.slug ? 'chip-active' : ''}`}
          >
            {cat.name}
          </button>
        ))}
        {(search || category || featured) && (
          <Link to="/products" className="chip border-rose-200 text-rose-500">
            <Icon.Close className="h-3.5 w-3.5" /> مسح الفلاتر
          </Link>
        )}
      </div>

      {loading ? (
        <Loading />
      ) : products.length === 0 ? (
        <EmptyState title="لم نجد أي منتج مطابق">
          <Link to="/products" className="btn-primary">عرض كل المنتجات</Link>
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => update('page', String(p))}
                  className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
                    p === page ? 'bg-brand text-white' : 'bg-white text-ink hover:bg-blush-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
