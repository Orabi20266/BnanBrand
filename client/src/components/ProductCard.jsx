import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { money } from '../api.js';
import { Icon } from './Icons.jsx';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const { show } = useToast();
  const { settings } = useSettings();

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const discountPercent =
    product.has_discount && product.price > 0
      ? Math.round(((product.price - product.discount_price) / product.price) * 100)
      : 0;

  const handleAdd = () => {
    add(product, 1, '');
    show(`تمت إضافة "${product.name}" إلى السلة`);
  };

  return (
    <div className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-soft">
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-blush-100">
        <img
          src={product.image || '/favicon.svg'}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {discountPercent > 0 && (
          <span className="badge absolute top-3 right-3 bg-brand text-white">خصم {discountPercent}%</span>
        )}
        {product.stock <= 0 && (
          <span className="badge absolute top-3 left-3 bg-ink/80 text-white">نفدت الكمية</span>
        )}
      </Link>

      <div className="p-4">
        {product.category_name && (
          <p className="mb-1 text-xs font-medium text-muted">{product.category_name}</p>
        )}
        <Link to={`/product/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-snug hover:text-brand">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-brand">
              {money(product.has_discount ? product.discount_price : product.price, settings.currency)}
            </span>
            {product.has_discount && (
              <span className="text-xs text-muted line-through">{money(product.price, settings.currency)}</span>
            )}
          </div>
        </div>

        {hasVariants ? (
          <Link to={`/product/${product.slug}`} className="btn-soft mt-3 w-full py-2.5 text-xs">
            اختر الخيارات
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={product.stock <= 0}
            className="btn-primary mt-3 w-full py-2.5 text-xs"
          >
            <Icon.Cart className="h-4 w-4" />
            {product.stock <= 0 ? 'غير متوفر' : 'أضف إلى السلة'}
          </button>
        )}
      </div>
    </div>
  );
}
