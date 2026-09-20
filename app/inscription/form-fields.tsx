"use client";

/** Petits blocs de formulaire réutilisés par les 8 étapes. */

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-sm font-medium text-brand-dark">{message}</p>
  );
}

export function TextField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  required = true,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
        {required && <span className="text-brand"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      />
      <FieldError message={error} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  error,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
        <span className="text-brand"> *</span>
      </label>
      <select
        id={name}
        name={name}
        value={value}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  value,
  onChange,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      />
      {hint && <p className="mt-1.5 text-sm text-brand-dark/60">{hint}</p>}
    </div>
  );
}

/** Grande carte tactile utilisée pour le créneau et le mode de règlement. */
export function ChoiceCard({
  name,
  value,
  checked,
  onSelect,
  title,
  lines,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  title: string;
  lines: string[];
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col rounded-2xl border-2 p-5 transition ${
        checked
          ? "border-brand bg-brand-light/10"
          : "border-brand-light/40 bg-white hover:border-brand-light"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span className="flex items-center justify-between gap-3">
        <span className="text-lg font-extrabold uppercase tracking-tight text-brand-dark">
          {title}
        </span>
        <span
          aria-hidden
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
            checked ? "border-brand bg-brand text-white" : "border-brand-light/70"
          }`}
        >
          {checked ? "✓" : ""}
        </span>
      </span>
      {lines.map((line, index) => (
        <span
          key={line}
          className={index === 0 ? "mt-2 font-semibold text-brand" : "mt-1 text-brand-dark/70"}
        >
          {line}
        </span>
      ))}
    </label>
  );
}

export function ConsentCheckbox({
  name,
  checked,
  onChange,
  children,
  error,
  optional,
}: {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  error?: string;
  optional?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-brand-light/40 bg-white p-4">
      <label className="flex cursor-pointer gap-3">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-6 w-6 shrink-0 accent-brand"
        />
        <span className="text-brand-dark/85">{children}</span>
      </label>
      <p className="mt-2 pl-9 text-xs font-semibold uppercase tracking-wide text-brand-dark/50">
        {optional ? "Facultatif" : "Obligatoire"}
      </p>
      <div className="pl-9">
        <FieldError message={error} />
      </div>
    </div>
  );
}
