"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateMember } from "@/app/admin/(protected)/actions";
import { SCHOOL_LEVELS, SCHOOL_LEVEL_LABELS } from "@/lib/constants";
import type { GroupInfo } from "@/lib/settings";

type Initial = Record<string, string>;

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
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
        defaultValue={defaultValue}
        className="field"
        required={required}
      />
    </div>
  );
}

function Area({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="sm:col-span-2">
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <textarea id={name} name={name} rows={2} defaultValue={defaultValue} className="field" />
    </div>
  );
}

export function EditMemberForm({
  memberId,
  initial,
  groups,
}: {
  memberId: string;
  initial: Initial;
  groups: GroupInfo[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-8"
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          const result = await updateMember(formData);
          if (result.ok) router.push(`/admin/adherentes/${memberId}`);
          else setError(result.message);
        })
      }
    >
      <input type="hidden" name="memberId" value={memberId} />

      <fieldset className="rounded-2xl border border-brand-light/40 bg-white p-5">
        <legend className="px-2 font-bold text-brand-dark">Adhérente</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="firstName" defaultValue={initial.firstName} required />
          <Field label="Nom" name="lastName" defaultValue={initial.lastName} required />
          <Field
            label="Date de naissance"
            name="birthDate"
            type="date"
            defaultValue={initial.birthDate}
            required
          />
          <div>
            <label className="label" htmlFor="schoolLevel">
              Classe <span className="text-brand">*</span>
            </label>
            <select
              id="schoolLevel"
              name="schoolLevel"
              defaultValue={initial.schoolLevel}
              className="field"
            >
              {SCHOOL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {SCHOOL_LEVEL_LABELS[level]}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Établissement"
            name="schoolName"
            defaultValue={initial.schoolName}
          />
          <div>
            <label className="label" htmlFor="groupName">
              Créneau <span className="text-brand">*</span>
            </label>
            <select
              id="groupName"
              name="groupName"
              defaultValue={initial.groupName}
              className="field"
            >
              {groups.map((group) => (
                <option key={group.key} value={group.key}>
                  {group.shortLabel} {group.time}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-brand-light/40 bg-white p-5">
        <legend className="px-2 font-bold text-brand-dark">Responsable légal</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="guardianFirstName" defaultValue={initial.guardianFirstName} required />
          <Field label="Nom" name="guardianLastName" defaultValue={initial.guardianLastName} required />
          <Field label="Téléphone" name="guardianPhone" type="tel" defaultValue={initial.guardianPhone} required />
          <Field label="Email" name="guardianEmail" type="email" defaultValue={initial.guardianEmail} required />
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-brand-light/40 bg-white p-5">
        <legend className="px-2 font-bold text-brand-dark">
          Contact d’urgence principal
        </legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="emergencyFirstName" defaultValue={initial.emergencyFirstName} required />
          <Field label="Nom" name="emergencyLastName" defaultValue={initial.emergencyLastName} />
          <Field label="Téléphone" name="emergencyPhone" type="tel" defaultValue={initial.emergencyPhone} required />
          <Field label="Lien de parenté" name="emergencyRelationship" defaultValue={initial.emergencyRelationship} />
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-brand-light/40 bg-white p-5">
        <legend className="px-2 font-bold text-brand-dark">
          Deuxième contact d’urgence
        </legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="secondFirstName" defaultValue={initial.secondFirstName} required />
          <Field label="Téléphone" name="secondPhone" type="tel" defaultValue={initial.secondPhone} required />
          <Field label="Lien de parenté" name="secondRelationship" defaultValue={initial.secondRelationship} />
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-brand-light/40 bg-white p-5">
        <legend className="px-2 font-bold text-brand-dark">Santé</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Area label="Allergies" name="allergies" defaultValue={initial.allergies} />
          <Area label="Traitements en cours" name="currentTreatments" defaultValue={initial.currentTreatments} />
          <Area label="Remarques" name="healthNotes" defaultValue={initial.healthNotes} />
        </div>
      </fieldset>

      {error && (
        <p className="rounded-xl bg-brand-light/25 px-4 py-3 text-brand-dark">{error}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          className="btn-ghost justify-center py-3"
          onClick={() => router.push(`/admin/adherentes/${memberId}`)}
          disabled={pending}
        >
          Annuler
        </button>
      </div>

      <p className="text-sm text-brand-dark/60">
        Le numéro d’adhérente et l’historique des consentements ne sont pas modifiables.
      </p>
    </form>
  );
}
