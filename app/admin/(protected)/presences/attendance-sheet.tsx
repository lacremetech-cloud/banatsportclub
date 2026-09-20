"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveAttendance } from "@/app/admin/(protected)/actions";
import { SmsButton } from "@/components/admin/sms-button";
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABELS } from "@/lib/constants";
import { absenceSms, latenessSms } from "@/lib/sms";

type MemberRow = {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  /** Numéro du responsable légal, pour le SMS d'information. */
  guardianPhone: string | null;
};

const TONES: Record<string, string> = {
  present: "bg-emerald-600 text-white border-emerald-600",
  absent: "bg-brand text-white border-brand",
  excused: "bg-amber-500 text-white border-amber-500",
  late: "bg-brand-dark text-white border-brand-dark",
};

/**
 * Feuille de présence pensée pour le téléphone : quatre gros boutons par
 * adhérente, aucun menu déroulant, un compteur visible en permanence.
 */
export function AttendanceSheet({
  sessionId,
  members,
  existing,
}: {
  sessionId: string;
  members: MemberRow[];
  existing: Record<string, string>;
}) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, string>>(() => ({ ...existing }));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const marked = members.filter((member) => statuses[member.id]).length;
  const present = members.filter(
    (member) => statuses[member.id] === "present" || statuses[member.id] === "late",
  ).length;

  if (members.length === 0) {
    return (
      <p className="rounded-2xl border border-brand-light/40 bg-white p-5 text-brand-dark/70">
        Aucune adhérente avec une adhésion validée dans ce groupe. La feuille de
        présence ne liste que les adhésions ACTIVE.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="sticky top-0 z-10 rounded-2xl bg-brand-light/25 px-4 py-3 text-lg font-semibold text-brand-dark">
        Présentes : {present} / {members.length}
      </p>

      <ul className="space-y-3">
        {members.map((member) => (
          <li
            key={member.id}
            className="rounded-2xl border border-brand-light/40 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-brand-dark">
                {member.firstName} {member.lastName.toUpperCase()}
              </p>
              {/* Le bouton n'apparaît que là où il a un sens : une absence ou
                  un retard qui vient d'être saisi. */}
              {statuses[member.id] === "absent" && (
                <SmsButton
                  phone={member.guardianPhone}
                  message={absenceSms(member.firstName)}
                  title={`Prévenir de l’absence de ${member.firstName}`}
                />
              )}
              {statuses[member.id] === "late" && (
                <SmsButton
                  phone={member.guardianPhone}
                  message={latenessSms(member.firstName)}
                  title={`Informer du retard de ${member.firstName}`}
                />
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ATTENDANCE_STATUSES.map((status) => {
                const active = statuses[member.id] === status;
                return (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setStatuses((current) => ({ ...current, [member.id]: status }))
                    }
                    className={`min-h-12 rounded-xl border-2 px-2 py-3 text-sm font-semibold transition ${
                      active
                        ? TONES[status]
                        : "border-brand-light/50 bg-white text-brand-dark hover:border-brand"
                    }`}
                  >
                    {ATTENDANCE_STATUS_LABELS[status]}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      {message && (
        <p className="rounded-xl bg-brand-light/25 px-4 py-3 text-brand-dark">{message}</p>
      )}

      <button
        type="button"
        className="btn w-full"
        disabled={pending || marked === 0}
        onClick={() =>
          startTransition(async () => {
            setMessage(null);
            const entries = members
              .filter((member) => statuses[member.id])
              .map((member) => ({ memberId: member.id, status: statuses[member.id] }));
            const result = await saveAttendance(sessionId, entries);
            setMessage(
              result.ok
                ? "Feuille de présence enregistrée."
                : result.message,
            );
            if (result.ok) router.refresh();
          })
        }
      >
        {pending ? "Enregistrement…" : "Enregistrer la feuille"}
      </button>
    </div>
  );
}
