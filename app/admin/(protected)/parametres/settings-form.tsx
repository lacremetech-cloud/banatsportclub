"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateSettings } from "@/app/admin/(protected)/actions";
import type { AdminSettings } from "@/lib/settings";

/**
 * Réglages de l'association.
 *
 * Un seul formulaire, trois blocs, un seul bouton d'enregistrement : le
 * bureau modifie ce qu'il veut, dans l'ordre qu'il veut, et valide une fois.
 * Éparpiller ces champs sur plusieurs pages obligerait à retenir lesquelles
 * ont été enregistrées.
 */
export function SettingsForm({ settings }: { settings: AdminSettings }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const euros = (cents: number) => (cents / 100).toFixed(2);

  return (
    <form
      className="space-y-6"
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          setSaved(false);
          const result = await updateSettings(formData);
          if (result.ok) {
            setSaved(true);
            router.refresh();
          } else {
            setError(result.message);
          }
        })
      }
    >
      <Block
        title="Saison et cotisations"
        hint="Le nouveau barème s’applique aux prochaines inscriptions. Les cotisations déjà enregistrées ne sont pas réécrites."
      >
        <Field
          name="season"
          label="Saison active"
          defaultValue={settings.season}
          placeholder="2026-2027"
          hint="Les adhésions et les écritures des saisons précédentes restent rattachées à leur saison."
          required
        />
        <Money
          name="annualFeeEuros"
          label="Cotisation standard"
          defaultValue={euros(settings.annualFeeCents)}
        />
        <Money
          name="solidarityFeeEuros"
          label="Cotisation solidaire"
          defaultValue={euros(settings.solidarityFeeCents)}
        />
        <Money
          name="partnerClubFeeEuros"
          label="Reversement club partenaire"
          defaultValue={euros(settings.partnerClubFeeCents)}
          hint="Par adhérente du dimanche. Provision indicative : aucune dépense n’est créée."
        />
      </Block>

      <Block
        title="Coordonnées bancaires"
        hint="Affichées à la famille qui choisit le virement. Tant qu’elles sont vides, la page indique que le bureau les communiquera."
      >
        <Field
          name="bankHolder"
          label="Titulaire"
          defaultValue={settings.bank.holder ?? ""}
          placeholder="BANAT SPORT CLUB"
        />
        <Field
          name="bankIban"
          label="IBAN"
          defaultValue={settings.bank.iban ?? ""}
          placeholder="FR76 ...."
          mono
          hint="Vérifié par sa clé de contrôle : un chiffre inversé est refusé."
        />
        <Field
          name="bankBic"
          label="BIC"
          defaultValue={settings.bank.bic ?? ""}
          placeholder="QNTOFRP1XXX"
          mono
        />
      </Block>

      <Block title="Association">
        <Field
          name="clubName"
          label="Nom du club"
          defaultValue={settings.association.name}
          required
        />
        <Field
          name="clubEmail"
          label="Email du bureau"
          type="email"
          defaultValue={settings.association.email}
          required
        />
        <Field
          name="clubPhone"
          label="Téléphone du club"
          type="tel"
          defaultValue={settings.association.phone}
          hint="Affiché sur le formulaire d’inscription, pour les situations particulières."
          required
        />
      </Block>

      {error && (
        <p className="rounded-xl bg-brand-light/25 px-4 py-3 font-medium text-brand-dark">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn w-full sm:w-auto" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
        {saved && !pending && (
          <p
            role="status"
            className="font-semibold text-emerald-700"
          >
            Modifications enregistrées ✓
          </p>
        )}
      </div>
    </form>
  );
}

function Block({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-brand-light/40 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold text-brand-dark">{title}</h2>
      {hint && <p className="mt-1 text-sm text-brand-dark/60">{hint}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
  type = "text",
  mono,
  required,
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  hint?: string;
  type?: string;
  mono?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={`field ${mono ? "font-mono" : ""}`}
      />
      {hint && <p className="mt-1 text-sm text-brand-dark/60">{hint}</p>}
    </div>
  );
}

function Money({
  name,
  label,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label} (€)
      </label>
      <input
        id={name}
        name={name}
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        defaultValue={defaultValue}
        required
        className="field"
      />
      {hint && <p className="mt-1 text-sm text-brand-dark/60">{hint}</p>}
    </div>
  );
}
