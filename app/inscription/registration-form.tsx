"use client";

import { useState } from "react";

import {
  GROUPS,
  SCHOOL_LEVELS,
  SCHOOL_LEVEL_LABELS,
} from "@/lib/constants";

type Result = { memberNumber: string } | null;

export function RegistrationForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setGlobalError(null);

    const payload = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors ?? {});
        setGlobalError(data.message ?? "Une erreur est survenue.");
        return;
      }

      setResult({ memberNumber: data.memberNumber });
    } catch {
      setGlobalError("Connexion impossible. Réessaie dans un instant.");
    } finally {
      setPending(false);
    }
  }

  if (result) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold text-brand-dark">Inscription enregistrée</h2>
        <p className="mt-3 text-brand-dark/80">
          Numéro d&apos;adhérente :{" "}
          <strong className="text-brand">{result.memberNumber}</strong>
        </p>
        <p className="mt-2 text-brand-dark/80">
          Le bureau valide l&apos;inscription après réception du paiement et des
          documents. Vous serez recontactée par email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section title="L'adhérente">
        <Field label="Prénom" name="firstName" error={errors.firstName} required />
        <Field label="Nom" name="lastName" error={errors.lastName} required />
        <Field
          label="Date de naissance"
          name="birthDate"
          type="date"
          error={errors.birthDate}
          required
        />
        <div>
          <label className="label" htmlFor="schoolLevel">
            Classe
          </label>
          <select id="schoolLevel" name="schoolLevel" className="field" required>
            {SCHOOL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {SCHOOL_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
          <FieldError message={errors.schoolLevel} />
        </div>
        <Field label="Établissement scolaire" name="schoolName" error={errors.schoolName} />
        <div>
          <label className="label" htmlFor="groupName">
            Groupe souhaité
          </label>
          <select id="groupName" name="groupName" className="field" required>
            {Object.entries(GROUPS).map(([key, group]) => (
              <option key={key} value={key}>
                {group.schedule} — {group.place}
              </option>
            ))}
          </select>
          <FieldError message={errors.groupName} />
        </div>
      </Section>

      <Section title="Responsable légal">
        <Field label="Prénom" name="guardianFirstName" error={errors.guardianFirstName} required />
        <Field label="Nom" name="guardianLastName" error={errors.guardianLastName} required />
        <Field
          label="Téléphone"
          name="guardianPhone"
          type="tel"
          error={errors.guardianPhone}
          required
        />
        <Field
          label="Email"
          name="guardianEmail"
          type="email"
          error={errors.guardianEmail}
          required
        />
      </Section>

      <Section title="Contact d'urgence">
        <Field
          label="Prénom"
          name="emergencyFirstName"
          error={errors.emergencyFirstName}
          required
        />
        <Field label="Nom" name="emergencyLastName" error={errors.emergencyLastName} required />
        <Field
          label="Téléphone"
          name="emergencyPhone"
          type="tel"
          error={errors.emergencyPhone}
          required
        />
        <Field
          label="Lien avec l'adhérente"
          name="emergencyRelationship"
          error={errors.emergencyRelationship}
        />
      </Section>

      <Section title="Informations médicales">
        <TextArea label="Allergies" name="allergies" error={errors.allergies} />
        <TextArea label="Traitements en cours" name="currentTreatments" error={errors.currentTreatments} />
        <TextArea label="Autres informations utiles" name="healthNotes" error={errors.healthNotes} />
      </Section>

      {globalError && (
        <p className="rounded-xl bg-brand-light/25 px-4 py-3 text-brand-dark">{globalError}</p>
      )}

      <button type="submit" className="btn w-full sm:w-auto" disabled={pending}>
        {pending ? "Envoi en cours…" : "Envoyer l'inscription"}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card">
      <legend className="px-2 text-lg font-semibold text-brand-dark">{title}</legend>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
        {required && <span className="text-brand"> *</span>}
      </label>
      <input id={name} name={name} type={type} className="field" required={required} />
      <FieldError message={error} />
    </div>
  );
}

function TextArea({ label, name, error }: { label: string; name: string; error?: string }) {
  return (
    <div className="sm:col-span-2">
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <textarea id={name} name={name} rows={2} className="field" />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-brand-dark">{message}</p>;
}
