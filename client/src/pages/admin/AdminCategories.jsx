import { useState } from 'react';
import { useApi } from '../../lib/useApi.js';
import { shrinkImage } from '../../lib/downscaleImage.js';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../api.js';
import Loading from '../../components/Loading.jsx';
import { Icon } from '../../components/Icons.jsx';

const empty = { id: null, name: '', description: '', image: '', sort_order: 0, is_active: true };

export default function AdminCategories() {
  const { data, loading, reload } = useApi('/api/admin/categories');
  const { show } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const categories = data?.items || [];

  const startEdit = (c) => setForm({ ...c, is_active: !!c.is_active });
  const reset = () => setForm(empty);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const small = await shrinkImage(file);
      const fd = new FormData();
      fd.append('image', small);
      const res = await api.upload('/api/admin/uploads', fd);
      setForm((f) => ({ ...f, image: res.url }));
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return show('اسم القسم مطلوب', 'error');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        image: form.image,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active ? 1 : 0,
      };
      if (form.id) await api.put(`/api/admin/categories/${form.id}`, payload);
      else await api.post('/api/admin/categories', payload);
      show(form.id ? 'تم تحديث القسم' : 'تمت إضافة القسم');
      reset();
      reload();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`حذف قسم "${c.name}"؟ ستبقى المنتجات بدون قسم.`)) return;
    try {
      await api.del(`/api/admin/categories/${c.id}`);
      show('تم حذف القسم');
      reload();
    } catch (e) {
      show(e.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">إدارة الأقسام</h1>

      <form onSubmit={submit} className="card grid gap-4 p-6 md:grid-cols-[1.5fr_1fr_auto]">
        <div>
          <label className="label">اسم القسم *</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">الوصف</label>
          <input
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="label">الترتيب</label>
          <input
            type="number"
            className="input"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-3 md:col-span-2">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-blush-100">
            <img src={form.image || '/favicon.svg'} alt="" className="h-full w-full object-cover" />
          </div>
          <label className="btn-soft cursor-pointer py-2.5 text-xs">
            <Icon.Upload className="h-4 w-4" /> {uploading ? 'جارٍ الرفع...' : 'صورة القسم'}
            <input type="file" accept="image/*" className="hidden" onChange={upload} />
          </label>
          {form.image && (
            <button type="button" onClick={() => setForm({ ...form, image: '' })} className="text-xs text-rose-500">
              إزالة الصورة
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex flex-1 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-5 w-5 accent-[#E75480]"
            />
            نشط
          </label>
          <button type="submit" disabled={saving} className="btn-primary py-2.5 text-xs">
            {form.id ? 'تحديث' : 'إضافة'}
          </button>
          {form.id && (
            <button type="button" onClick={reset} className="btn-ghost py-2.5 text-xs">إلغاء</button>
          )}
        </div>
      </form>

      {loading ? (
        <Loading />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="card flex items-center gap-4 p-4">
              <img src={c.image || '/favicon.svg'} alt="" className="h-16 w-16 rounded-2xl bg-blush-100 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="text-xs text-muted">{c.product_count} منتج</p>
                {!c.is_active && <span className="badge mt-1 bg-gray-100 text-gray-500">مخفي</span>}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => startEdit(c)} className="rounded-full bg-blush-100 p-2 text-brand hover:bg-blush-200">
                  <Icon.Edit className="h-4 w-4" />
                </button>
                <button onClick={() => remove(c)} className="rounded-full bg-rose-50 p-2 text-rose-500 hover:bg-rose-100">
                  <Icon.Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
