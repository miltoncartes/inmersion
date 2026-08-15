import type { ReactNode } from "react";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T extends { id?: string }>({
  columns,
  rows,
  keyFn,
  emptyMessage = "Sin registros todavía.",
}: {
  columns: Column<T>[];
  rows: T[];
  keyFn: (row: T) => string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="card flex items-center justify-center px-6 py-12 text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-navy-700/70">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`eyebrow px-4 py-3 text-left font-medium ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyFn(row)} className="border-b border-navy-800/70 last:border-0 hover:bg-navy-800/40">
              {columns.map((col, i) => (
                <td key={i} className={`px-4 py-3 text-slate-200 ${col.className ?? ""}`}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
