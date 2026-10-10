import { useEffect, useState } from 'react';
import { useApi } from '../../lib/useApi.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../api.js';
import Loading from '../../components/Loading.jsx';
import { Icon } from '../../components/Icons.jsx';

const fields = [
  { key: 'company_name', label: 'اسم الشركة', type: 'text' },
  { key: 'company_email', label: 'البريد الإلكتروني للشركة', type: 'email' },
  { key: 'phone', label: 'رقم الهاتف', type: 'text' },
  { key: 'whatsapp', label: 'رقم واتساب (بصيغة دولية)', type: 'text' },
  { key: 'address', label: 'العنوان', type: 'text' },
  { key: 'currency', label: 'رمز العملة', type: 'text' },
  { key: 'shipping_fee', label: 'قيمة التوصيل', type: 'number' },
  { key: 'free_shipping_threshold', label: 'توصيل مجاني عند تجاوز', type: 'number' },
];

export default function AdminSettings() {
  const { data, loading, reload } = useApi('/api/admin/settings');
  const { refresh } = useSettings();
  const { show } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  if (loading || !form) return <Loading />;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/admin/settings', form);
      await refresh();
      show('تم حفظ الإعدادات');
      reload();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwd.new_password.length < 6) return show('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
    if (pwd.new_password !== pwd.confirm) return show('كلمتا المرور غير متطابقتين', 'error');
    setSavingPwd(true);
    try {
      await api.put('/api/auth/password', {
        current_password: pwd.current_password,
        new_password: pwd.new_password,
      });
      show('تم تحديث كلمة المرور');
      setPwd({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">الإعدادات</h1>

      <form onSubmit={save} className="card space-y-5 p-6">
        <h2 className="font-bold">بيانات الشركة والمتجر</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input
                type={f.type}
                className="input"
                value={form[f.key] ?? ''}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div>
          <label className="label">نبذة عن المتجر</label>
          <textarea
            className="input min-h-28 resize-y"
            value={form.about_text ?? ''}
            onChange={(e) => setForm({ ...form, about_text: e.target.value })}
          />
        </div>
        <button type="submit" disabled={saving} className="btn-primary py-2.5 text-xs">
          <Icon.Check className="h-4 w-4" /> {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </form>

      <form onSubmit={changePassword} className="card space-y-5 p-6">
        <h2 className="font-bold">تغيير كلمة مرور الأدمن</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">كلمة المرور الحالية</label>
            <input
              type="password"
              className="input"
              value={pwd.current_password}
              onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })}
            />
          </div>
          <div>
            <label className="label">كلمة المرور الجديدة</label>
            <input
              type="password"
              className="input"
              value={pwd.new_password}
              onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
            />
          </div>
          <div>
            <label className="label">تأكيد كلمة المرور</label>
            <input
              type="password"
              className="input"
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            />
          </div>
        </div>
        <button type="submit" disabled={savingPwd} className="btn-soft py-2.5 text-xs">
          <Icon.Shield className="h-4 w-4" /> {savingPwd ? 'جارٍ التحديث...' : 'تحديث كلمة المرور'}
        </button>
      </form>
    </div>
  );
}
