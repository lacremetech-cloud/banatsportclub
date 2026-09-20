"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import {
  PREFERRED_PAYMENT_METHODS,
  PREFERRED_PAYMENT_METHOD_HINTS,
  PREFERRED_PAYMENT_METHOD_LABELS,
  SCHOOL_LEVELS,
  SCHOOL_LEVEL_LABELS,
  formatDate,
  formatEuros,
  type PreferredPaymentMethod,
} from "@/lib/constants";
import { PUBLIC_INSTALLMENT_PLANS, splitInstallments } from "@/lib/fees";
import type { GroupInfo } from "@/lib/settings";
import { REGISTRATION_STEP_SCHEMAS, formatZodErrors } from "@/lib/validation";

import {
  ConfirmationScreen,
  type BankDetails,
  type RegistrationResult,
} from "./confirmation";
import {
  CheckboxField,
  ChoiceCard,
  ConsentCheckbox,
  FieldError,
  SelectField,
  TextAreaField,
  TextField,
} from "./form-fields";

type Values = {
  firstName: string;
  lastName: string;
  birthDate: string;
  schoolLevel: string;
  schoolName: string;
  groupName: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianPhone: string;
  guardianEmail: string;
  emergencySameAsGuardian: boolean;
  emergencyPhone: string;
  emergencyFirstName: string;
  emergencyLastName: string;
  emergencyRelationship: string;
  allergies: string;
  currentTreatments: string;
  healthNotes: string;
  acceptsInternalRules: boolean;
  acceptsParentalAuthorization: boolean;
  acceptsImageRights: boolean;
  guardianFullName: string;
  preferredPaymentMethod: string;
  paymentInstallments: number;
};

const STEP_TITLES = [
  "Parlons d’elle",
  "Quel créneau lui convient ?",
  "Vos coordonnées",
  "Un second numéro à joindre",
  "Quelques informations utiles",
  "Autorisations",
  "Le règlement de la cotisation",
  "Tout est bon ?",
];

const TOTAL_STEPS = STEP_TITLES.length;

/** À quelle étape se corrige chaque champ, pour y renvoyer en cas d'erreur. */
const FIELD_STEPS: Record<string, number> = {
  firstName: 0,
  lastName: 0,
  birthDate: 0,
  schoolLevel: 0,
  schoolName: 0,
  groupName: 1,
  guardianFirstName: 2,
  guardianLastName: 2,
  guardianPhone: 2,
  guardianEmail: 2,
  emergencySameAsGuardian: 3,
  emergencyFirstName: 3,
  emergencyLastName: 3,
  emergencyPhone: 3,
  emergencyRelationship: 3,
  allergies: 4,
  currentTreatments: 4,
  healthNotes: 4,
  acceptsInternalRules: 5,
  acceptsParentalAuthorization: 5,
  acceptsImageRights: 5,
  guardianFullName: 5,
  preferredPaymentMethod: 6,
  paymentInstallments: 6,
};

function emptyValues(defaultGroup: string): Values {
  return {
    firstName: "",
    lastName: "",
    birthDate: "",
    schoolLevel: "",
    schoolName: "",
    groupName: defaultGroup,
    guardianFirstName: "",
    guardianLastName: "",
    guardianPhone: "",
    guardianEmail: "",
    emergencySameAsGuardian: true,
    emergencyPhone: "",
    emergencyFirstName: "",
    emergencyLastName: "",
    emergencyRelationship: "",
    allergies: "",
    currentTreatments: "",
    healthNotes: "",
    acceptsInternalRules: false,
    acceptsParentalAuthorization: false,
    acceptsImageRights: false,
    guardianFullName: "",
    preferredPaymentMethod: "",
    paymentInstallments: 1,
  };
}

export function RegistrationWizard({
  groups,
  season,
  annualFeeCents,
  defaultGroup,
  bank,
}: {
  groups: GroupInfo[];
  season: string;
  annualFeeCents: number;
  defaultGroup: string;
  bank: BankDetails;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(() => emptyValues(defaultGroup));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  // Garde-fou contre les doubles clics : l'état React est asynchrone.
  const submittingRef = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  function focusFirstError(fieldErrors: Record<string, string>) {
    const firstField = Object.keys(fieldErrors)[0];
    if (!firstField) return;
    requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>(
        `[name="${firstField}"]`,
      );
      element?.focus();
      element?.scrollIntoView({ block: "center" });
    });
  }

  function goTo(nextStep: number) {
    setStep(nextStep);
    setGlobalError(null);
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  }

  function handleNext() {
    const schema = REGISTRATION_STEP_SCHEMAS[step];
    // La dernière étape est un récapitulatif : rien à valider.
    if (!schema) return;

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = formatZodErrors(parsed.error);
      setErrors(fieldErrors);
      focusFirstError(fieldErrors);
      return;
    }

    setErrors({});
    goTo(step + 1);
  }

  async function handleSubmit() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setGlobalError(null);

    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        const fieldErrors: Record<string, string> = data.errors ?? {};
        setErrors(fieldErrors);
        setGlobalError(
          data.message ?? "L’inscription n’a pas pu être enregistrée.",
        );
        const firstField = Object.keys(fieldErrors)[0];
        if (firstField && FIELD_STEPS[firstField] !== undefined) {
          setStep(FIELD_STEPS[firstField]);
          focusFirstError(fieldErrors);
        }
        return;
      }

      setResult(data as RegistrationResult);
      requestAnimationFrame(() => window.scrollTo({ top: 0 }));
    } catch {
      setGlobalError(
        "La connexion a échoué. Vérifiez votre réseau et réessayez.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (result) {
    return <ConfirmationScreen result={result} groups={groups} bank={bank} />;
  }

  const group = groups.find((item) => item.key === values.groupName);

  // Avertissement volontairement non bloquant : on signale, on n'interdit pas.
  const samePhoneWarning =
    values.emergencyPhone.trim().length > 0 &&
    values.emergencyPhone.replace(/\s/g, "") ===
      values.guardianPhone.replace(/\s/g, "");

  return (
    <div ref={topRef} className="scroll-mt-24">
      <h1 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
        Inscription
      </h1>
      <p className="mt-3 mb-10 text-brand-dark/75">
        Saison {season} — cotisation annuelle {formatEuros(annualFeeCents)}.
        Quelques minutes suffisent.
      </p>

      <div className="mb-6">
        <p className="text-sm font-medium text-brand-dark/60">
          Étape {step + 1} sur {TOTAL_STEPS}
        </p>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-light/30"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
        >
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
        {STEP_TITLES[step]}
      </h2>

      <div className="mt-6 space-y-5">
        {step === 0 && (
          <>
            <TextField
              label="Prénom"
              name="firstName"
              value={values.firstName}
              onChange={(value) => set("firstName", value)}
              error={errors.firstName}
              autoComplete="given-name"
            />
            <TextField
              label="Nom"
              name="lastName"
              value={values.lastName}
              onChange={(value) => set("lastName", value)}
              error={errors.lastName}
              autoComplete="family-name"
            />
            <TextField
              label="Date de naissance"
              name="birthDate"
              type="date"
              value={values.birthDate}
              onChange={(value) => set("birthDate", value)}
              error={errors.birthDate}
              autoComplete="bday"
            />
            <SelectField
              label="Classe"
              name="schoolLevel"
              value={values.schoolLevel}
              onChange={(value) => set("schoolLevel", value)}
              error={errors.schoolLevel}
              placeholder="Choisir une classe"
              options={SCHOOL_LEVELS.map((level) => ({
                value: level,
                label: SCHOOL_LEVEL_LABELS[level],
              }))}
            />
            <TextField
              label="Établissement scolaire"
              name="schoolName"
              value={values.schoolName}
              onChange={(value) => set("schoolName", value)}
              error={errors.schoolName}
            />
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {groups.map((item) => (
                <ChoiceCard
                  key={item.key}
                  name="groupName"
                  value={item.key}
                  checked={values.groupName === item.key}
                  onSelect={(value) => set("groupName", value)}
                  title={item.day}
                  lines={[item.time, item.place]}
                />
              ))}
            </div>
            <FieldError message={errors.groupName} />
          </>
        )}

        {step === 2 && (
          <>
            <TextField
              label="Prénom"
              name="guardianFirstName"
              value={values.guardianFirstName}
              onChange={(value) => set("guardianFirstName", value)}
              error={errors.guardianFirstName}
              autoComplete="given-name"
            />
            <TextField
              label="Nom"
              name="guardianLastName"
              value={values.guardianLastName}
              onChange={(value) => set("guardianLastName", value)}
              error={errors.guardianLastName}
              autoComplete="family-name"
            />
            <TextField
              label="Téléphone"
              name="guardianPhone"
              type="tel"
              value={values.guardianPhone}
              onChange={(value) => set("guardianPhone", value)}
              error={errors.guardianPhone}
              autoComplete="tel"
            />
            <TextField
              label="Email"
              name="guardianEmail"
              type="email"
              value={values.guardianEmail}
              onChange={(value) => set("guardianEmail", value)}
              error={errors.guardianEmail}
              autoComplete="email"
            />
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-brand-dark/75">
              Le club a besoin de deux numéros pour être sûr de joindre
              quelqu’un pendant les séances.
            </p>

            <CheckboxField
              name="emergencySameAsGuardian"
              checked={values.emergencySameAsGuardian}
              onChange={(checked) => set("emergencySameAsGuardian", checked)}
              label="C’est moi qu’il faut joindre en priorité"
              hint="Décochez si une autre personne doit être appelée en cas d’urgence."
            />

            <TextField
              label={
                values.emergencySameAsGuardian
                  ? "Un autre numéro où vous joindre"
                  : "Téléphone du contact d’urgence"
              }
              name="emergencyPhone"
              type="tel"
              value={values.emergencyPhone}
              onChange={(value) => set("emergencyPhone", value)}
              error={errors.emergencyPhone}
              autoComplete="tel"
            />

            {samePhoneWarning && (
              <p className="rounded-xl bg-brand-light/25 px-4 py-3 text-sm text-brand-dark">
                Ce numéro est identique à celui de l’étape précédente. Si vous
                n’êtes pas joignable, le club n’aura aucun autre contact.
              </p>
            )}

            {!values.emergencySameAsGuardian && (
              <>
                <TextField
                  label="Prénom"
                  name="emergencyFirstName"
                  value={values.emergencyFirstName}
                  onChange={(value) => set("emergencyFirstName", value)}
                  error={errors.emergencyFirstName}
                />
                <TextField
                  label="Nom"
                  name="emergencyLastName"
                  value={values.emergencyLastName}
                  onChange={(value) => set("emergencyLastName", value)}
                  error={errors.emergencyLastName}
                />
                <TextField
                  label="Lien avec l’adhérente"
                  name="emergencyRelationship"
                  value={values.emergencyRelationship}
                  onChange={(value) => set("emergencyRelationship", value)}
                  error={errors.emergencyRelationship}
                />
              </>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <p className="text-brand-dark/75">
              Ces informations nous permettent de mieux accompagner l’adhérente
              pendant les activités.
            </p>
            <TextAreaField
              label="Allergies"
              name="allergies"
              value={values.allergies}
              onChange={(value) => set("allergies", value)}
            />
            <TextAreaField
              label="Traitement en cours"
              name="currentTreatments"
              value={values.currentTreatments}
              onChange={(value) => set("currentTreatments", value)}
            />
            <TextAreaField
              label="Autres informations utiles"
              name="healthNotes"
              value={values.healthNotes}
              onChange={(value) => set("healthNotes", value)}
              hint="Tous ces champs sont facultatifs, laissez-les vides si rien à signaler."
            />
          </>
        )}

        {step === 5 && (
          <>
            <ConsentCheckbox
              name="acceptsInternalRules"
              checked={values.acceptsInternalRules}
              onChange={(checked) => set("acceptsInternalRules", checked)}
              error={errors.acceptsInternalRules}
            >
              J’ai pris connaissance du règlement intérieur de Banat Sport Club
              et je m’engage à le respecter.
              <Link
                href="/reglement"
                target="_blank"
                className="mt-2 block font-semibold text-brand underline"
              >
                Consulter le règlement intérieur
              </Link>
            </ConsentCheckbox>

            <ConsentCheckbox
              name="acceptsParentalAuthorization"
              checked={values.acceptsParentalAuthorization}
              onChange={(checked) => set("acceptsParentalAuthorization", checked)}
              error={errors.acceptsParentalAuthorization}
            >
              J’autorise ma fille / l’adhérente dont je suis responsable légal à
              participer aux activités de Banat Sport Club.
            </ConsentCheckbox>

            <ConsentCheckbox
              name="acceptsImageRights"
              checked={values.acceptsImageRights}
              onChange={(checked) => set("acceptsImageRights", checked)}
              optional
            >
              J’autorise Banat Sport Club à prendre des photos ou vidéos de
              l’adhérente dans le cadre des activités du club.
              <span className="mt-2 block text-sm text-brand-dark/60">
                Un refus ne bloque pas l’inscription : l’adhérente participe
                normalement et sera exclue des prises de vue. Les images sont
                destinées à l’archivage interne et ne sont pas diffusées
                publiquement.
              </span>
            </ConsentCheckbox>

            <TextField
              label="Nom et prénom du parent / représentant légal signataire"
              name="guardianFullName"
              value={values.guardianFullName}
              onChange={(value) => set("guardianFullName", value)}
              error={errors.guardianFullName}
              autoComplete="name"
            />

            <div className="rounded-2xl border-2 border-dashed border-brand-light/60 bg-white p-6 text-center">
              <p className="text-sm font-semibold text-brand-dark/60">
                Signature
              </p>
              <p className="mt-1 text-sm text-brand-dark/50">
                La signature digitale sera disponible prochainement.
              </p>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <div className="rounded-2xl bg-brand-light/15 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-dark/60">
                Cotisation annuelle
              </p>
              <p className="mt-1 text-3xl font-extrabold text-brand-dark">
                {formatEuros(annualFeeCents)}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-brand-dark">En une ou deux fois ?</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {PUBLIC_INSTALLMENT_PLANS.map((plan) => {
                  const parts = splitInstallments(annualFeeCents, plan);
                  return (
                    <ChoiceCard
                      key={plan}
                      name="paymentInstallments"
                      value={String(plan)}
                      checked={values.paymentInstallments === plan}
                      onSelect={(value) => set("paymentInstallments", Number(value))}
                      title={plan === 1 ? "En 1 fois" : "En 2 fois"}
                      badge={plan === 1 ? "Le plus simple" : undefined}
                      lines={[
                        plan === 1
                          ? formatEuros(annualFeeCents)
                          : `2 × ${formatEuros(parts[0])}`,
                        plan === 1
                          ? "Tout est réglé en une seule fois."
                          : "La seconde échéance est réglée plus tard.",
                      ]}
                    />
                  );
                })}
              </div>
              <FieldError message={errors.paymentInstallments} />
            </div>

            <div>
              <h3 className="font-bold text-brand-dark">Comment souhaitez-vous régler ?</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {PREFERRED_PAYMENT_METHODS.map((method) => (
                  <ChoiceCard
                    key={method}
                    name="preferredPaymentMethod"
                    value={method}
                    checked={values.preferredPaymentMethod === method}
                    onSelect={(value) => set("preferredPaymentMethod", value)}
                    title={PREFERRED_PAYMENT_METHOD_LABELS[method]}
                    lines={[PREFERRED_PAYMENT_METHOD_HINTS[method]]}
                  />
                ))}
              </div>
              <FieldError message={errors.preferredPaymentMethod} />
            </div>
            <p className="text-sm text-brand-dark/60">
              Vous indiquez seulement le mode de règlement souhaité. Aucun
              paiement n’est encaissé à cette étape.
            </p>
          </>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <SummaryBlock title="Adhérente" onEdit={() => goTo(0)}>
              <SummaryLine label="Prénom" value={values.firstName} />
              <SummaryLine label="Nom" value={values.lastName} />
              <SummaryLine
                label="Date de naissance"
                value={values.birthDate ? formatDate(values.birthDate) : "—"}
              />
              <SummaryLine
                label="Classe"
                value={
                  SCHOOL_LEVEL_LABELS[
                    values.schoolLevel as keyof typeof SCHOOL_LEVEL_LABELS
                  ] ?? "—"
                }
              />
              <SummaryLine label="Établissement" value={values.schoolName} />
            </SummaryBlock>

            <SummaryBlock title="Créneau" onEdit={() => goTo(1)}>
              <SummaryLine
                label="Groupe"
                value={group ? `${group.day} ${group.time} — ${group.place}` : "—"}
              />
            </SummaryBlock>

            <SummaryBlock title="Responsable légal" onEdit={() => goTo(2)}>
              <SummaryLine
                label="Nom"
                value={`${values.guardianFirstName} ${values.guardianLastName}`}
              />
              <SummaryLine label="Téléphone" value={values.guardianPhone} />
              <SummaryLine label="Email" value={values.guardianEmail} />
            </SummaryBlock>

            <SummaryBlock title="Second numéro" onEdit={() => goTo(3)}>
              <SummaryLine
                label="Nom"
                value={
                  values.emergencySameAsGuardian
                    ? `${values.guardianFirstName} ${values.guardianLastName}`
                    : `${values.emergencyFirstName} ${values.emergencyLastName}`
                }
              />
              <SummaryLine label="Téléphone" value={values.emergencyPhone} />
              <SummaryLine
                label="Lien"
                value={
                  values.emergencySameAsGuardian
                    ? "Responsable légal"
                    : values.emergencyRelationship
                }
              />
            </SummaryBlock>

            <SummaryBlock title="Informations de santé" onEdit={() => goTo(4)}>
              <SummaryLine label="Allergies" value={values.allergies || "Aucune indiquée"} />
              <SummaryLine
                label="Traitement"
                value={values.currentTreatments || "Aucun indiqué"}
              />
              <SummaryLine
                label="Autres"
                value={values.healthNotes || "Rien à signaler"}
              />
            </SummaryBlock>

            <SummaryBlock title="Autorisations" onEdit={() => goTo(5)}>
              <SummaryLine
                label="Règlement intérieur"
                value={values.acceptsInternalRules ? "Accepté" : "Non accepté"}
              />
              <SummaryLine
                label="Autorisation parentale"
                value={values.acceptsParentalAuthorization ? "Accordée" : "Non accordée"}
              />
              <SummaryLine
                label="Droit à l’image"
                value={values.acceptsImageRights ? "Autorisé" : "Refusé"}
              />
              <SummaryLine label="Signataire" value={values.guardianFullName} />
            </SummaryBlock>

            <SummaryBlock title="Paiement choisi" onEdit={() => goTo(6)}>
              <SummaryLine
                label="Mode de règlement"
                value={
                  PREFERRED_PAYMENT_METHOD_LABELS[
                    values.preferredPaymentMethod as PreferredPaymentMethod
                  ] ?? "—"
                }
              />
              <SummaryLine
                label="Rythme"
                value={
                  values.paymentInstallments === 2
                    ? `En 2 fois — 2 × ${formatEuros(splitInstallments(annualFeeCents, 2)[0])}`
                    : "En 1 fois"
                }
              />
              <SummaryLine label="Cotisation" value={formatEuros(annualFeeCents)} />
              <SummaryLine label="Saison" value={season} />
            </SummaryBlock>
          </div>
        )}
      </div>

      {globalError && (
        <p className="mt-6 rounded-xl bg-brand-light/25 px-4 py-3 text-brand-dark">
          {globalError}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
        {step < TOTAL_STEPS - 1 ? (
          <button type="button" className="btn w-full sm:w-auto" onClick={handleNext}>
            Continuer
          </button>
        ) : (
          <button
            type="button"
            className="btn w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Inscription en cours…" : "Valider l’inscription"}
          </button>
        )}

        {step > 0 && (
          <button
            type="button"
            className="btn-ghost w-full justify-center py-3 sm:w-auto"
            onClick={() => goTo(step - 1)}
            disabled={submitting}
          >
            Précédent
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-bold text-brand-dark">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-semibold text-brand underline"
        >
          Modifier
        </button>
      </div>
      <dl className="mt-3 space-y-1.5">{children}</dl>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-2 text-sm">
      <dt className="text-brand-dark/60">{label} :</dt>
      <dd className="font-medium text-brand-dark">{value.trim() || "—"}</dd>
    </div>
  );
}
