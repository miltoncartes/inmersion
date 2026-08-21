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

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

type TimeFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  /** Hora en formato "HH:MM", o cadena vacía si no se ha elegido. */
  value: string;
  onChange: (value: string) => void;
};

/**
 * Selector de hora con dos <select> (hora / minuto) en vez de <input type="time">.
 * El control nativo depende del selector del sistema operativo del navegador
 * (spinner de Chrome, "wheel" de Safari, etc.) y en varios equipos no responde
 * al intentar subir/bajar la hora. Con dos selects el comportamiento es
 * siempre el mismo, sin importar navegador ni sistema operativo.
 */
export function TimeField({ label, required, error, value, onChange }: TimeFieldProps) {
  const [hora, minuto] = value ? value.split(":") : ["", ""];

  function actualizar(nuevaHora: string, nuevoMinuto: string) {
    if (nuevaHora && nuevoMinuto) onChange(`${nuevaHora}:${nuevoMinuto}`);
    else onChange("");
  }

  return (
    <FieldWrap label={label} required={required} error={error}>
      <div className="flex items-center gap-2">
        <select
          className="field-input"
          value={hora}
          required={required}
          aria-label={`${label} — hora`}
          onChange={(e) => actualizar(e.target.value, minuto || "00")}
        >
          <option value="">HH</option>
          {HORAS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-slate-500">:</span>
        <select
          className="field-input"
          value={minuto}
          required={required}
          aria-label={`${label} — minutos`}
          onChange={(e) => actualizar(hora || "00", e.target.value)}
        >
          <option value="">MM</option>
          {MINUTOS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
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
