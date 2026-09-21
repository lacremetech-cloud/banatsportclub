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
  list,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  /** Identifiant d'un <datalist> : des suggestions, pas une contrainte. */
  list?: string;
  hint?: string;
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
        list={list}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      />
      {hint && <p className="mt-1 text-sm text-brand-dark/60">{hint}</p>}
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
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
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
        aria-invalid={error ? true : undefined}
        className="field"
      />
      {hint && <p className="mt-1.5 text-sm text-brand-dark/60">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

/** Grande carte tactile utilisée pour le créneau et le mode de règlement. */
export function ChoiceCard({
  name,
  value,
  checked,
  onSelect,
  header,
  title,
  lines,
  badge,
  footer,
  disabled,
  disabledLabel,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  /** Bandeau au-dessus du titre : ce qu'on doit voir en premier. */
  header?: React.ReactNode;
  title: string;
  lines: string[];
  /** Petite étiquette, pour signaler le choix le plus courant. */
  badge?: string;
  /** Contenu libre sous les lignes : un lien, une précision. */
  footer?: React.ReactNode;
  /** Option affichée mais pas encore proposée : grisée et non cliquable. */
  disabled?: boolean;
  /** Ce qui remplace la pastille de sélection : « Bientôt disponible ». */
  disabledLabel?: string;
}) {
  return (
    <label
      // `aria-disabled` plutôt que masquer la carte : l'option reste lisible
      // et annoncée, elle n'est simplement pas encore proposée.
      aria-disabled={disabled || undefined}
      className={`flex flex-col rounded-2xl border-2 p-5 transition ${
        disabled
          ? "cursor-not-allowed border-brand-light/30 bg-brand-light/5 opacity-60"
          : checked
            ? "cursor-pointer border-brand bg-brand-light/10"
            : "cursor-pointer border-brand-light/40 bg-white hover:border-brand-light"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      {header}
      <span className="flex items-center justify-between gap-3">
        <span className="text-lg font-extrabold uppercase tracking-tight text-brand-dark">
          {title}
          {badge && (
            <span className="ml-2 rounded-full bg-brand px-2.5 py-1 align-middle text-[11px] font-bold uppercase tracking-wide text-white">
              {badge}
            </span>
          )}
        </span>
        {disabled && disabledLabel ? (
          <span className="shrink-0 rounded-full bg-brand-dark/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-dark/60">
            {disabledLabel}
          </span>
        ) : (
          <span
            aria-hidden
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
              checked ? "border-brand bg-brand text-white" : "border-brand-light/70"
            }`}
          >
            {checked ? "✓" : ""}
          </span>
        )}
      </span>
      {lines.map((line, index) => (
        <span
          key={line}
          className={index === 0 ? "mt-2 font-semibold text-brand" : "mt-1 text-brand-dark/70"}
        >
          {line}
        </span>
      ))}
      {footer}
    </label>
  );
}

/**
 * Choix court en ligne : deux ou trois réponses, une seule ligne.
 *
 * `ChoiceCard` existe déjà, mais c'est une grande carte faite pour un choix
 * structurant — un créneau, un mode de règlement. Une question fermée
 * (« oui / non ») dans ce format occuperait tout l'écran et donnerait à une
 * formalité le poids d'une décision.
 */
export function RadioRow({
  name,
  value,
  onSelect,
  label,
  options,
  hint,
  error,
}: {
  name: string;
  value: string;
  onSelect: (value: string) => void;
  label: string;
  options: { value: string; label: string }[];
  hint?: React.ReactNode;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="font-semibold text-brand-dark">{label}</legend>
      {hint && <div className="mt-1 text-sm text-brand-dark/65">{hint}</div>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 px-4 py-2 font-semibold transition ${
                checked
                  ? "border-brand bg-brand-light/15 text-brand-dark"
                  : "border-brand-light/40 bg-white text-brand-dark/70 hover:border-brand-light"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onSelect(option.value)}
                className="h-5 w-5 accent-brand"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}

/** Case à cocher simple, pour les choix de parcours (pas les consentements). */
export function CheckboxField({
  name,
  checked,
  onChange,
  label,
  hint,
}: {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-light/40 bg-white p-4">
      <label className="flex cursor-pointer gap-3">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-6 w-6 shrink-0 accent-brand"
        />
        <span className="font-medium text-brand-dark">{label}</span>
      </label>
      {hint && <p className="mt-2 pl-9 text-sm text-brand-dark/60">{hint}</p>}
    </div>
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
