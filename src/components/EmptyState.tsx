import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <div className="text-amber-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-400">{description}</p>}
      {action}
    </div>
  );
}

export function AnchorIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v14M12 12H7m5 0h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M6 15c0 3.3 2.7 6 6 6s6-2.7 6-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M9 9h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
