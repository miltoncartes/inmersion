export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card px-5 py-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-50">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
