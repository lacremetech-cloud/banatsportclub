import { asc, eq } from "drizzle-orm";

import {
  REGISTRATION_STATUS_LABELS,
  SCHOOL_LEVEL_LABELS,
  formatDate,
} from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdherentesPage() {
  const { season, groups } = await getSiteSettings();

  const rows = await db
    .select({
      id: schema.members.id,
      memberNumber: schema.members.memberNumber,
      firstName: schema.members.firstName,
      lastName: schema.members.lastName,
      birthDate: schema.members.birthDate,
      schoolLevel: schema.members.schoolLevel,
      schoolName: schema.members.schoolName,
      groupName: schema.members.groupName,
      registrationStatus: schema.members.registrationStatus,
      guardianPhone: schema.guardians.phone,
      guardianEmail: schema.guardians.email,
    })
    .from(schema.members)
    .leftJoin(schema.guardians, eq(schema.guardians.memberId, schema.members.id))
    .where(eq(schema.members.season, season))
    .orderBy(asc(schema.members.lastName), asc(schema.members.firstName));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Adhérentes</h1>
        <p className="mt-1 text-brand-dark/70">
          {rows.length} inscrite{rows.length > 1 ? "s" : ""} pour la saison {season}.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="card text-brand-dark/70">Aucune inscription pour le moment.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-light/40 bg-white">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="bg-brand-light/15 text-brand-dark">
              <tr>
                <Th>Numéro</Th>
                <Th>Nom</Th>
                <Th>Naissance</Th>
                <Th>Classe</Th>
                <Th>Groupe</Th>
                <Th>Contact</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-brand-light/30 align-top">
                  <Td className="font-mono text-xs">{row.memberNumber}</Td>
                  <Td>
                    <span className="font-medium text-brand-dark">
                      {row.firstName} {row.lastName}
                    </span>
                    {row.schoolName && (
                      <span className="block text-xs text-brand-dark/60">{row.schoolName}</span>
                    )}
                  </Td>
                  <Td>{formatDate(row.birthDate)}</Td>
                  <Td>
                    {SCHOOL_LEVEL_LABELS[row.schoolLevel as keyof typeof SCHOOL_LEVEL_LABELS] ??
                      row.schoolLevel}
                  </Td>
                  <Td>{groups.find((g) => g.key === row.groupName)?.day ?? row.groupName}</Td>
                  <Td>
                    <span className="block">{row.guardianPhone}</span>
                    <span className="block text-xs text-brand-dark/60">{row.guardianEmail}</span>
                  </Td>
                  <Td>
                    {REGISTRATION_STATUS_LABELS[
                      row.registrationStatus as keyof typeof REGISTRATION_STATUS_LABELS
                    ] ?? row.registrationStatus}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
