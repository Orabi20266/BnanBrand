import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import ProductCard from '../components/ProductCard.jsx';
import Loading, { EmptyState } from '../components/Loading.jsx';
import { Icon } from '../components/Icons.jsx';

export default function CategoryPage() {
  const { slug } = useParams();
  const [sort, setSort] = useState('newest');
  const { data: catData } = useApi(`/api/categories/${slug}`);
  const { data, loading } = useApi(`/api/products?category=${slug}&sort=${sort}&limit=60`);
  const products = data?.items || [];

  return (
    <div className="container-x py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Link to="/" className="hover:text-brand">الرئيسية</Link>
        <span>/</span>
        <Link to="/categories" className="hover:text-brand">الأقسام</Link>
        <span>/</span>
        <span className="text-ink">{catData?.category?.name || '...'}</span>
      </nav>

      {catData?.category && (
        <div className="mb-8 flex flex-col items-start gap-5 overflow-hidden rounded-3xl bg-gradient-to-l from-blush-100 to-white p-6 md:flex-row md:items-center">
          {catData.category.image && (
            <img
              src={catData.category.image}
              alt={catData.category.name}
              className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-card"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-ink">{catData.category.name}</h1>
            <p className="mt-1 text-sm text-muted">{catData.category.description}</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted">{products.length} منتج</p>
        <label className="flex items-center gap-2 text-sm">
          <Icon.Sparkle className="h-3.5 w-3.5 text-brand" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input w-auto py-2 text-sm"
          >
            <option value="newest">الأحدث</option>
            <option value="price-asc">السعر: من الأقل للأعلى</option>
            <option value="price-desc">السعر: من الأعلى للأقل</option>
            <option value="name">الاسم</option>
          </select>
        </label>
      </div>

      {loading ? (
        <Loading />
      ) : products.length === 0 ? (
        <EmptyState title="لا توجد منتجات في هذا القسم بعد">
          <Link to="/products" className="btn-primary">تصفّحي كل المنتجات</Link>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
