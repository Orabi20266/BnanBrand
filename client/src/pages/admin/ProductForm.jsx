import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../api.js';
import Loading from '../../components/Loading.jsx';
import { Icon } from '../../components/Icons.jsx';

const emptyForm = {
  name: '',
  description: '',
  category_id: '',
  price: '',
  discount_price: '',
  image: '',
  stock: '',
  is_featured: false,
  is_active: true,
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();

  const { data: catData } = useApi('/api/admin/categories');
  const { data: productData, loading } = useApi(isEdit ? `/api/admin/products/${id}` : null);

  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const categories = catData?.items || [];

  useEffect(() => {
    if (isEdit && productData?.product) {
      const p = productData.product;
      setForm({
        name: p.name || '',
        description: p.description || '',
        category_id: p.category_id ? String(p.category_id) : '',
        price: String(p.price ?? ''),
        discount_price: p.discount_price != null ? String(p.discount_price) : '',
        image: p.image || '',
        stock: String(p.stock ?? ''),
        is_featured: !!p.is_featured,
        is_active: !!p.is_active,
      });
      setImages(p.images?.length ? p.images : p.image ? [p.image] : []);
      setVariants(
        (p.variants || []).map((v) => ({ name: v.name, optionsText: (v.options || []).join('، ') }))
      );
    }
  }, [isEdit, productData]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const uploadFile = async (file) => {
    if (!file) return null;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.upload('/api/admin/uploads', fd);
      return res.url;
    } catch (e) {
      show(e.message, 'error');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onMainImage = async (e) => {
    const url = await uploadFile(e.target.files?.[0]);
    if (url) {
      set('image', url);
      setImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
    }
  };

  const onGallery = async (e) => {
    const url = await uploadFile(e.target.files?.[0]);
    if (url) setImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
  };

  const addVariant = () => setVariants((v) => [...v, { name: '', optionsText: '' }]);
  const updateVariant = (i, key, value) =>
    setVariants((v) => v.map((item, idx) => (idx === i ? { ...item, [key]: value } : item)));
  const removeVariant = (i) => setVariants((v) => v.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return show('اسم المنتج مطلوب', 'error');
    if (form.price === '' || Number(form.price) < 0) return show('السعر غير صالح', 'error');

    const payload = {
      name: form.name.trim(),
      description: form.description,
      category_id: form.category_id || null,
      price: Number(form.price),
      discount_price: form.discount_price === '' ? null : Number(form.discount_price),
      image: form.image,
      images,
      stock: Number(form.stock) || 0,
      is_featured: form.is_featured ? 1 : 0,
      is_active: form.is_active ? 1 : 0,
      variants: variants
        .filter((v) => v.name.trim() && v.optionsText.trim())
        .map((v) => ({
          name: v.name.trim(),
          options: v.optionsText
            .split(/[,،]/)
            .map((s) => s.trim())
            .filter(Boolean),
        })),
    };

    setSaving(true);
    try {
      if (isEdit) await api.put(`/api/admin/products/${id}`, payload);
      else await api.post('/api/admin/products', payload);
      show(isEdit ? 'تم تحديث المنتج' : 'تمت إضافة المنتج');
      navigate('/products');
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading) return <Loading />;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/products" className="text-sm text-muted hover:text-brand">← المنتجات</Link>
          <h1 className="mt-1 text-xl font-bold">{isEdit ? 'تعديل منتج' : 'إضافة منتج جديد'}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/products" className="btn-ghost py-2.5 text-xs">إلغاء</Link>
          <button type="submit" disabled={saving || uploading} className="btn-primary py-2.5 text-xs">
            <Icon.Check className="h-4 w-4" /> {saving ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card space-y-5 p-6">
            <h2 className="font-bold">المعلومات الأساسية</h2>
            <div>
              <label className="label">اسم المنتج *</label>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">الوصف</label>
              <textarea
                className="input min-h-32 resize-y"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
            <div>
              <label className="label">القسم</label>
              <select
                className="input"
                value={form.category_id}
                onChange={(e) => set('category_id', e.target.value)}
              >
                <option value="">بدون قسم</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card space-y-5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">الخيارات (تنويعات)</h2>
              <button type="button" onClick={addVariant} className="btn-soft py-2 text-xs">
                <Icon.Plus className="h-4 w-4" /> إضافة خيار
              </button>
            </div>
            {variants.length === 0 && (
              <p className="text-sm text-muted">لا توجد خيارات. أضيفي مثل «اللون» أو «الحجم».</p>
            )}
            {variants.map((v, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]">
                <input
                  className="input"
                  placeholder="اسم الخيار (مثال: اللون)"
                  value={v.name}
                  onChange={(e) => updateVariant(i, 'name', e.target.value)}
                />
                <input
                  className="input"
                  placeholder="القيم مفصولة بفاصلة: وردي، أبيض"
                  value={v.optionsText}
                  onChange={(e) => updateVariant(i, 'optionsText', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="rounded-2xl bg-rose-50 px-3 text-rose-500 hover:bg-rose-100"
                >
                  <Icon.Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="card space-y-5 p-6">
            <h2 className="font-bold">معرض الصور</h2>
            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <div key={img} className="group relative h-24 w-24 overflow-hidden rounded-2xl bg-blush-100">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((x) => x !== img))}
                    className="absolute inset-0 grid place-items-center bg-ink/40 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <Icon.Trash className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-blush-300 text-muted hover:border-brand hover:text-brand">
                <Icon.Upload className="h-5 w-5" />
                <input type="file" accept="image/*" className="hidden" onChange={onGallery} />
              </label>
            </div>
            <div>
              <label className="label">أو أضيفي رابط صورة</label>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="https://..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const v = e.currentTarget.value.trim();
                      if (v) {
                        setImages((prev) => (prev.includes(v) ? prev : [...prev, v]));
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
                <span className="btn-ghost shrink-0 py-3 text-xs">Enter لإضافة</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card space-y-5 p-6">
            <h2 className="font-bold">السعر والمخزون</h2>
            <div>
              <label className="label">السعر الأساسي *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
              />
            </div>
            <div>
              <label className="label">السعر بعد الخصم</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                placeholder="اتركيه فارغاً إن لم يوجد خصم"
                value={form.discount_price}
                onChange={(e) => set('discount_price', e.target.value)}
              />
            </div>
            <div>
              <label className="label">الكمية في المخزون</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
              />
            </div>
          </div>

          <div className="card space-y-4 p-6">
            <h2 className="font-bold">الصورة الرئيسية</h2>
            <div className="overflow-hidden rounded-2xl border border-blush-100 bg-blush-50">
              <img src={form.image || '/favicon.svg'} alt="" className="aspect-square w-full object-cover" />
            </div>
            <label className="btn-soft w-full cursor-pointer py-2.5 text-xs">
              <Icon.Upload className="h-4 w-4" />
              {uploading ? 'جارٍ الرفع...' : 'رفع صورة'}
              <input type="file" accept="image/*" className="hidden" onChange={onMainImage} />
            </label>
          </div>

          <div className="card space-y-3 p-6">
            <h2 className="font-bold">الحالة</h2>
            <label className="flex items-center justify-between text-sm">
              <span>منتج مميز</span>
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => set('is_featured', e.target.checked)}
                className="h-5 w-5 accent-[#E75480]"
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>ظاهر في المتجر</span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)}
                className="h-5 w-5 accent-[#E75480]"
              />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
