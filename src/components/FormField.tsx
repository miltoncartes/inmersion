import { useState } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type FieldWrapProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
};

function FieldWrap({ label, required, error, children }: FieldWrapProps) {
  return (
    <div>
      <label className="field-label">
        {label} {required && <span className="text-coral-500">*</span>}
      </label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  required?: boolean;
  error?: string;
};

export function TextField({ label, required, error, className, ...props }: InputProps) {
  return (
    <FieldWrap label={label} required={required} error={error}>
      <input className={`field-input ${className ?? ""}`} {...props} />
    </FieldWrap>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  required?: boolean;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  /** Oculta la opción vacía inicial, para selects que siempre tienen valor. */
  sinOpcionVacia?: boolean;
};

export function SelectField({
  label,
  required,
  error,
  options,
  placeholder = "Selecciona...",
  sinOpcionVacia,
  className,
  ...props
}: SelectProps) {
  return (
    <FieldWrap label={label} required={required} error={error}>
      <select className={`field-input ${className ?? ""}`} {...props}>
        {!sinOpcionVacia && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}

type MultiSelectProps = {
  label: string;
  required?: boolean;
  error?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
};

/**
 * Combo box de selección múltiple: las opciones elegidas se muestran como
 * chips dentro de la misma caja, y al hacer clic se despliega el listado
 * completo con casillas (lo ya elegido aparece marcado).
 */
export function MultiSelectField({
  label,
  required,
  error,
  value,
  onChange,
  options,
  placeholder = "Selecciona...",
}: MultiSelectProps) {
  const [abierto, setAbierto] = useState(false);

  function alternar(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  function quitar(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(value.filter((v) => v !== id));
  }

  return (
    <FieldWrap label={label} required={required} error={error}>
      <div className="relative">
        <div
          className={`field-input flex min-h-[42px] cursor-pointer flex-wrap items-center gap-1.5 ${
            abierto ? "border-coral-500 ring-1 ring-coral-500" : ""
          }`}
          onClick={() => setAbierto((v) => !v)}
        >
          {value.length === 0 && <span className="text-slate-500">{placeholder}</span>}
          {value.map((id) => {
            const opt = options.find((o) => o.value === id);
            if (!opt) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-navy-600 bg-navy-800 py-1 pl-3 pr-1.5 text-xs text-slate-100"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => quitar(id, e)}
                  aria-label={`Quitar ${opt.label}`}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-navy-700 text-slate-400 hover:text-slate-200"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
        {abierto && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
            <div className="card absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto p-1.5">
              {options.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-slate-500">Sin opciones cargadas.</p>
              )}
              {options.map((o) => {
                const marcado = value.includes(o.value);
                return (
                  <label
                    key={o.value}
                    className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-navy-800 ${
                      marcado ? "bg-coral-500/10" : ""
                    }`}
                  >
                    <input type="checkbox" checked={marcado} onChange={() => alternar(o.value)} />
                    <span className="text-slate-200">{o.label}</span>
                  </label>
                );
              })}
            </div>
          </>
        )}
      </div>
    </FieldWrap>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  required?: boolean;
  error?: string;
};

export function TextareaField({ label, required, error, className, ...props }: TextareaProps) {
  return (
    <FieldWrap label={label} required={required} error={error}>
      <textarea className={`field-input resize-y ${className ?? ""}`} {...props} />
    </FieldWrap>
  );
}
