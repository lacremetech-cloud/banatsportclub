"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABELS } from "@/lib/constants";

type MemberRow = {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
};

export function AttendanceSheet({
  groupName,
  sessionDate,
  members,
  existing,
}: {
  groupName: string;
  sessionDate: string;
  members: MemberRow[];
  existing: Record<string, string>;
}) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map((member) => [member.id, existing[member.id] ?? "present"])),
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setMessage(null);

    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupName,
        sessionDate,
        entries: members.map((member) => ({
          memberId: member.id,
          status: statuses[member.id],
        })),
      }),
    });

    setPending(false);
    setMessage(response.ok ? "Feuille de présence enregistrée." : "Enregistrement impossible.");
    if (response.ok) router.refresh();
  }

  if (members.length === 0) {
    return <p className="card text-brand-dark/70">Aucune adhérente dans ce groupe.</p>;
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-brand-light/30 overflow-hidden rounded-2xl border border-brand-light/40 bg-white">
        {members.map((member) => (
          <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span>
              <span className="font-medium text-brand-dark">
                {member.lastName} {member.firstName}
              </span>
              <span className="block font-mono text-xs text-brand-dark/60">
                {member.memberNumber}
              </span>
            </span>
            <select
              className="field w-auto min-w-40"
              value={statuses[member.id]}
              onChange={(event) =>
                setStatuses((current) => ({ ...current, [member.id]: event.target.value }))
              }
              aria-label={`Présence de ${member.firstName} ${member.lastName}`}
            >
              {ATTENDANCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ATTENDANCE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>

      {message && (
        <p className="rounded-xl bg-brand-light/25 px-4 py-3 text-brand-dark">{message}</p>
      )}

      <button type="button" className="btn" onClick={save} disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer la feuille"}
      </button>
    </div>
  );
}
