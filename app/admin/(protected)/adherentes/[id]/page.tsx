import Link from "next/link";
import { notFound } from "next/navigation";

import { SmsButton } from "@/components/admin/sms-button";
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
import { FEE_TYPE_LABELS, installmentLabel, type FeeType } from "@/lib/fees";
import { getFeeScale } from "@/lib/settings";
import { paymentReminderSms } from "@/lib/sms";

import {
  AddPaymentForm,
  CancelMembershipButton,
  ChangeFeeButton,
  ChangeInstallmentsButton,
  DeletePaymentButton,
  EquipmentAction,
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
  const [detail, feeScale] = await Promise.all([getMemberDetail(id), getFeeScale()]);
  if (!detail) notFound();

  const {
    member,
    guardian,
    emergency,
    secondContact,
    medical,
    consents,
    payments,
    notes,
    attendance,
    attendanceStats,
    paidCents,
    dueCents,
    paymentStatus,
    installments,
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
          <div className="flex flex-col gap-2 sm:items-end">
            <p className="flex flex-wrap items-center gap-2 text-sm text-brand-dark/60">
              Adhésion <RegistrationBadge status={member.registrationStatus} />
            </p>
            <p className="flex flex-wrap items-center gap-2 text-sm text-brand-dark/60">
              Paiement <PaymentBadge status={paymentStatus} full />
            </p>
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
            {group ? (
              <>
                {group.day} {group.time} — {group.place}
                <a
                  href={group.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 text-sm text-brand underline"
                >
                  {group.address}
                </a>
              </>
            ) : (
              member.groupName
            )}
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

      <Section title="Contact d’urgence principal">
        {emergency ? (
          <dl>
            <DataLine label="Prénom">{emergency.firstName}</DataLine>
            {emergency.lastName && <DataLine label="Nom">{emergency.lastName}</DataLine>}
            <DataLine label="Lien de parenté">{orDash(emergency.relationship)}</DataLine>
            <DataLine label="Téléphone">
              <a href={`tel:${emergency.phone}`} className="text-brand underline">
                {emergency.phone}
              </a>
            </DataLine>
          </dl>
        ) : (
          <EmptyState>Aucun renseignement</EmptyState>
        )}
      </Section>

      <Section title="Deuxième contact d’urgence">
        {secondContact ? (
          <dl>
            <DataLine label="Prénom">{secondContact.firstName}</DataLine>
            {secondContact.lastName && (
              <DataLine label="Nom">{secondContact.lastName}</DataLine>
            )}
            <DataLine label="Lien de parenté">
              {orDash(secondContact.relationship)}
            </DataLine>
            <DataLine label="Téléphone">
              <a href={`tel:${secondContact.phone}`} className="text-brand underline">
                {secondContact.phone}
              </a>
            </DataLine>
          </dl>
        ) : (
          <EmptyState>
            Aucun deuxième contact enregistré. Les inscriptions antérieures au
            21 septembre 2026 n’en comportaient pas.
          </EmptyState>
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
        <p className="text-brand-dark/80">
          Cotisation{" "}
          <strong className="text-brand-dark">
            {FEE_TYPE_LABELS[member.feeType as FeeType] ?? member.feeType}
          </strong>{" "}
          · {installmentLabel(installments.plan)}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="Cotisation" value={formatEuros(member.feeAmountCents)} />
          <StatCard label="Payé" value={formatEuros(paidCents)} />
          <StatCard
            label="Reste"
            value={formatEuros(dueCents)}
            accent={dueCents > 0 && member.registrationStatus !== "CANCELLED"}
          />
        </div>

        {installments.plan > 1 && (
          <p className="mt-4 rounded-xl bg-brand-light/15 px-4 py-3 font-semibold text-brand-dark">
            Échéances réglées : {installments.settled} / {installments.plan}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <ChangeFeeButton
            memberId={member.id}
            currentFeeType={member.feeType}
            scale={feeScale}
          />
          <ChangeInstallmentsButton
            memberId={member.id}
            currentPlan={installments.plan}
            feeAmountCents={member.feeAmountCents}
          />
          {dueCents > 0 && member.registrationStatus !== "CANCELLED" && (
            <SmsButton
              phone={guardian?.phone}
              message={paymentReminderSms(member.firstName, dueCents)}
              label="SMS de relance"
              title={`Rappeler qu’il reste ${formatEuros(dueCents)} à régler`}
            />
          )}
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

      <Section title="Équipement">
        <EquipmentAction
          memberId={member.id}
          delivered={member.equipmentDelivered}
          deliveredAt={member.equipmentDeliveredAt?.toISOString() ?? null}
        />
      </Section>

      <Section title="Documents">
        <EmptyState>Gestion des documents à venir.</EmptyState>
      </Section>
    </div>
  );
}
