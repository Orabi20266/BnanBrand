import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { money } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import Loading from '../components/Loading.jsx';
import { Icon } from '../components/Icons.jsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const { data, loading, error } = useApi(`/api/products/${slug}`);
  const { add } = useCart();
  const { show } = useToast();
  const { settings } = useSettings();

  const product = data?.product;
  const related = data?.related || [];

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState({});

  const images = useMemo(() => {
    if (!product) return [];
    const list = [product.image, ...(product.images || [])].filter(Boolean);
    return [...new Set(list)];
  }, [product]);

  if (loading) return <Loading />;
  if (error || !product) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-2xl font-bold">المنتج غير موجود</h1>
        <Link to="/products" className="btn-primary mt-6 inline-flex">عرض المنتجات</Link>
      </div>
    );
  }

  const price = product.has_discount ? product.discount_price : product.price;
  const discountPercent = product.has_discount
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  const variantText = (product.variants || [])
    .map((v) => (selected[v.name] ? `${v.name}: ${selected[v.name]}` : null))
    .filter(Boolean)
    .join(' • ');

  const missingVariant = (product.variants || []).some((v) => !selected[v.name]);

  const handleAdd = () => {
    if (missingVariant) {
      show('يرجى اختيار جميع الخيارات أولاً', 'error');
      return;
    }
    add(product, quantity, variantText);
    show('تمت الإضافة إلى السلة');
  };

  return (
    <div className="container-x py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link to="/" className="hover:text-brand">الرئيسية</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-brand">المنتجات</Link>
        {product.category_name && (
          <>
            <span>/</span>
            <Link to={`/categories/${product.category_slug}`} className="hover:text-brand">
              {product.category_name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-3xl border-4 border-white bg-blush-100 shadow-card">
            <img
              src={images[activeImage] || '/favicon.svg'}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(i)}
                  className={`h-20 w-20 overflow-hidden rounded-2xl border-2 transition ${
                    i === activeImage ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category_name && (
            <Link
              to={`/categories/${product.category_slug}`}
              className="badge bg-blush-100 text-brand-dark"
            >
              {product.category_name}
            </Link>
          )}
          <h1 className="mt-3 text-3xl font-bold text-ink">{product.name}</h1>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex text-amber-400">
              {[0, 1, 2, 3, 4].map((i) => (
                <Icon.Star key={i} className="h-4 w-4" />
              ))}
            </div>
            <span className="text-xs text-muted">تقييم ممتاز من عميلاتنا</span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold text-brand">{money(price, settings.currency)}</span>
            {product.has_discount && (
              <>
                <span className="text-lg text-muted line-through">{money(product.price, settings.currency)}</span>
                <span className="badge bg-brand text-white">وفّري {discountPercent}%</span>
              </>
            )}
          </div>

          <p className="mt-5 leading-relaxed text-muted">{product.description}</p>

          <div className="mt-4">
            {product.stock > 0 ? (
              <span className="badge bg-emerald-100 text-emerald-700">
                <Icon.Check className="ml-1 h-3.5 w-3.5" /> متوفر ({product.stock} قطعة)
              </span>
            ) : (
              <span className="badge bg-rose-100 text-rose-600">نفدت الكمية</span>
            )}
          </div>

          {/* Variants */}
          {(product.variants || []).map((v) => (
            <div key={v.name} className="mt-6">
              <p className="label">{v.name}</p>
              <div className="flex flex-wrap gap-2">
                {v.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelected((s) => ({ ...s, [v.name]: opt }))}
                    className={`chip ${
                      selected[v.name] === opt ? 'chip-active' : ''
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity + add */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 rounded-full border border-blush-200 bg-white px-3 py-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="rounded-full p-1.5 hover:bg-blush-100"
                aria-label="تقليل"
              >
                <Icon.Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="rounded-full p-1.5 hover:bg-blush-100"
                aria-label="زيادة"
              >
                <Icon.Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className="btn-primary flex-1 py-3.5"
            >
              <Icon.Cart className="h-5 w-5" />
              {product.stock <= 0 ? 'غير متوفر' : 'أضف إلى السلة'}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
            {[
              { icon: Icon.Truck, t: 'توصيل سريع' },
              { icon: Icon.Shield, t: 'دفع آمن' },
              { icon: Icon.Gift, t: 'تغليف مجاني' },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl bg-blush-50 p-3">
                <x.icon className="mx-auto mb-1 h-5 w-5 text-brand" />
                {x.t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-ink">قد يعجبك أيضاً</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
