const styles: Record<string, string> = {
  activo: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  inactivo: "bg-slate-500/15 text-slate-400 ring-slate-500/30",
  suspendido: "bg-red-500/15 text-red-400 ring-red-500/30",
  vencido: "bg-red-500/15 text-red-400 ring-red-500/30",
  por_vencer: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  admin: "bg-coral-500/15 text-coral-400 ring-coral-500/30",
  supervisor: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
  lectura: "bg-slate-500/15 text-slate-400 ring-slate-500/30",
};

export function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  const cls = styles[tone] ?? styles.inactivo;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${cls}`}>
      {children}
    </span>
  );
}
