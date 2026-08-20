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
