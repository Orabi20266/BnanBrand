import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-7xl font-bold text-brand">٤٠٤</p>
        <h1 className="mt-4 text-2xl font-bold text-ink">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-muted">عذراً، الصفحة التي تبحثين عنها غير متاحة.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">العودة للرئيسية</Link>
      </div>
    </div>
  );
}
