import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BackLink,
  DataLine,
  EmptyState,
  PaymentBadge,
  RegistrationBadge,
  Section,
  StatCard,
} from "@/components/admin/ui";
import {
  ATTENDANCE_STATUS_LABELS,
  CONSENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PREFERRED_PAYMENT_METHOD_LABELS,
  SCHOOL_LEVEL_LABELS,
  type ConsentType,
  type PreferredPaymentMethod,
  formatDate,
  formatEuros,
} from "@/lib/constants";
import { getMemberDetail } from "@/lib/crm";

import {
  AddPaymentForm,
  CancelMembershipButton,
  DeletePaymentButton,
  NotesSection,
} from "./member-actions";

export const dynamic = "force-dynamic";

function orDash(value: string | null | undefined) {
  return value?.trim() ? value : "Aucun renseignement";
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getMemberDetail(id);
  if (!detail) notFound();

  const {
    member,
    guardian,
    emergency,
    medical,
    consents,
    payments,
    notes,
    attendance,
    attendanceStats,
    paidCents,
    dueCents,
    paymentStatus,
    annualFeeCents,
    group,
  } = detail;

  const consentByType = new Map(consents.map((row) => [row.type, row]));
  const signatory = consents.find((row) => row.guardianFullName)?.guardianFullName;

  return (
    <div className="space-y-6">
      <BackLink href="/admin/adherentes">Retour à la liste</BackLink>

      <header className="rounded-2xl border border-brand-light/40 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">
              {member.firstName} {member.lastName.toUpperCase()}
            </h1>
            <p className="mt-1 font-mono text-sm text-brand">{member.memberNumber}</p>
            <p className="mt-1 text-brand-dark/70">
              {SCHOOL_LEVEL_LABELS[
                member.schoolLevel as keyof typeof SCHOOL_LEVEL_LABELS
              ] ?? member.schoolLevel}{" "}
              · {group ? `${group.day} ${group.time} — ${group.place}` : member.groupName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RegistrationBadge status={member.registrationStatus} />
            <PaymentBadge status={paymentStatus} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/admin/adherentes/${member.id}/modifier`} className="btn-ghost">
            Modifier
          </Link>
          {member.registrationStatus !== "CANCELLED" && (
            <CancelMembershipButton memberId={member.id} />
          )}
        </div>
      </header>

      <Section title="Informations">
        <dl>
          <DataLine label="Prénom">{member.firstName}</DataLine>
          <DataLine label="Nom">{member.lastName}</DataLine>
          <DataLine label="Date de naissance">{formatDate(member.birthDate)}</DataLine>
          <DataLine label="Classe">
            {SCHOOL_LEVEL_LABELS[
              member.schoolLevel as keyof typeof SCHOOL_LEVEL_LABELS
            ] ?? member.schoolLevel}
          </DataLine>
          <DataLine label="Établissement">{orDash(member.schoolName)}</DataLine>
          <DataLine label="Créneau">
            {group ? `${group.day} ${group.time} — ${group.place}` : member.groupName}
          </DataLine>
        </dl>
      </Section>

      <Section title="Responsable légal">
        {guardian ? (
          <dl>
            <DataLine label="Prénom">{guardian.firstName}</DataLine>
            <DataLine label="Nom">{guardian.lastName}</DataLine>
            <DataLine label="Téléphone">
              <a href={`tel:${guardian.phone}`} className="text-brand underline">
                {guardian.phone}
              </a>
            </DataLine>
            <DataLine label="Email">
              <a href={`mailto:${guardian.email}`} className="text-brand underline">
                {guardian.email}
              </a>
            </DataLine>
          </dl>
        ) : (
          <EmptyState>Aucun renseignement</EmptyState>
        )}
      </Section>

      <Section title="Second numéro / contact d’urgence">
        {emergency ? (
          <dl>
            <DataLine label="Prénom">{emergency.firstName}</DataLine>
            <DataLine label="Nom">{emergency.lastName}</DataLine>
            <DataLine label="Téléphone">
              <a href={`tel:${emergency.phone}`} className="text-brand underline">
                {emergency.phone}
              </a>
            </DataLine>
            <DataLine label="Lien de parenté">{orDash(emergency.relationship)}</DataLine>
          </dl>
        ) : (
          <EmptyState>Aucun renseignement</EmptyState>
        )}
      </Section>

      <Section title="Santé">
        <dl>
          <DataLine label="Allergies">{orDash(medical?.allergies)}</DataLine>
          <DataLine label="Traitements">{orDash(medical?.currentTreatments)}</DataLine>
          <DataLine label="Remarques">{orDash(medical?.healthNotes)}</DataLine>
        </dl>
      </Section>

      <Section title="Autorisations">
        <dl>
          {(["INTERNAL_RULES", "PARENTAL_AUTHORIZATION", "IMAGE_RIGHTS"] as ConsentType[]).map(
            (type) => {
              const consent = consentByType.get(type);
              const accepted = consent?.accepted ?? false;
              const label =
                type === "IMAGE_RIGHTS"
                  ? accepted
                    ? "Autorisé"
                    : "Refusé"
                  : accepted
                    ? "Accepté"
                    : "Non accepté";
              return (
                <DataLine key={type} label={CONSENT_TYPE_LABELS[type]}>
                  <span className={accepted ? "text-brand-dark" : "text-brand"}>
                    {label}
                  </span>
                  {consent?.acceptedAt && (
                    <span className="ml-2 text-sm text-brand-dark/60">
                      le {formatDate(consent.acceptedAt)}
                    </span>
                  )}
                </DataLine>
              );
            },
          )}
          <DataLine label="Signataire">{orDash(signatory)}</DataLine>
        </dl>
      </Section>

      <Section
        title="Paiement"
        action={
          <AddPaymentForm
            memberId={member.id}
            suggestedEuros={(Math.max(dueCents, 0) / 100).toFixed(2)}
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Cotisation" value={formatEuros(annualFeeCents)} />
          <StatCard label="Total payé" value={formatEuros(paidCents)} />
          <StatCard
            label="Reste à régler"
            value={formatEuros(dueCents)}
            accent={dueCents > 0 && member.registrationStatus !== "CANCELLED"}
          />
        </div>

        <p className="mt-4 text-brand-dark/70">
          Mode de règlement prévu à l’inscription :{" "}
          <strong className="text-brand-dark">
            {PREFERRED_PAYMENT_METHOD_LABELS[
              member.preferredPaymentMethod as PreferredPaymentMethod
            ] ?? "non précisé"}
          </strong>
        </p>

        <h3 className="mt-6 font-semibold text-brand-dark">Historique</h3>
        {payments.length === 0 ? (
          <p className="mt-2 text-brand-dark/60">Aucun paiement enregistré.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-light/30 px-4 py-3"
              >
                <span>
                  <span className="font-semibold text-brand-dark">
                    {formatEuros(payment.amountCents)}
                  </span>
                  <span className="ml-2 text-brand-dark/70">
                    {PAYMENT_METHOD_LABELS[
                      payment.method as keyof typeof PAYMENT_METHOD_LABELS
                    ] ?? payment.method}
                  </span>
                  <span className="block text-sm text-brand-dark/60">
                    {formatDate(payment.paidAt ?? payment.createdAt)}
                    {payment.provider ? ` · ${payment.provider}` : " · saisie manuelle"}
                    {payment.status !== "paid" ? ` · ${payment.status}` : ""}
                    {payment.notes ? ` · ${payment.notes}` : ""}
                  </span>
                </span>
                {payment.provider ? (
                  <span className="text-sm text-brand-dark/50">
                    Encaissement en ligne
                  </span>
                ) : (
                  <DeletePaymentButton
                    memberId={member.id}
                    paymentId={payment.id}
                    amountCents={payment.amountCents}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Présences">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Séances" value={String(attendanceStats.sessions)} />
          <StatCard label="Présentes" value={String(attendanceStats.present)} />
          <StatCard label="Absences" value={String(attendanceStats.absent)} />
          <StatCard label="Justifiées" value={String(attendanceStats.excused)} />
          <StatCard label="Retards" value={String(attendanceStats.late)} />
        </div>
        <p className="mt-4 text-brand-dark/80">
          Taux de présence :{" "}
          <strong>
            {attendanceStats.rate === null ? "—" : `${attendanceStats.rate} %`}
          </strong>
        </p>
        <p className="mt-1 text-sm text-brand-dark/60">
          Calculé sur les séances où une présence a été saisie pour cette adhérente.
          Présences et retards comptent comme présents.
        </p>

        {attendance.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {attendance.slice(0, 10).map((row) => (
              <li
                key={`${row.sessionDate}-${row.groupName}`}
                className="flex justify-between gap-4 border-b border-brand-light/20 py-1.5 last:border-0"
              >
                <span className="text-brand-dark/70">{formatDate(row.sessionDate)}</span>
                <span className="font-medium text-brand-dark">
                  {ATTENDANCE_STATUS_LABELS[
                    row.status as keyof typeof ATTENDANCE_STATUS_LABELS
                  ] ?? row.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Notes internes">
        <NotesSection
          memberId={member.id}
          notes={notes.map((note) => ({
            id: note.id,
            content: note.content,
            authorName: note.authorName,
            createdAt: note.createdAt.toISOString(),
          }))}
        />
      </Section>

      <Section title="Documents">
        <EmptyState>Gestion des documents à venir.</EmptyState>
      </Section>
    </div>
  );
}
