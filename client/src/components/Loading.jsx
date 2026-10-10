export default function Loading({ label = 'جارٍ التحميل...' }) {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blush-200 border-t-brand" />
      <p className="mt-4 text-sm text-muted">{label}</p>
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="grid place-items-center gap-4 py-20 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-blush-100 text-3xl">🌸</div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {children}
    </div>
  );
}
