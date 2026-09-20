import { count, eq, sum } from "drizzle-orm";
import Link from "next/link";

import { formatEuros } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { season, annualFeeCents: feeCents, groups } = await getSiteSettings();

  const [byStatus, byGroup, [collected]] = await Promise.all([
    db
      .select({ status: schema.members.registrationStatus, total: count() })
      .from(schema.members)
      .where(eq(schema.members.season, season))
      .groupBy(schema.members.registrationStatus),
    db
      .select({ groupName: schema.members.groupName, total: count() })
      .from(schema.members)
      .where(eq(schema.members.season, season))
      .groupBy(schema.members.groupName),
    db
      .select({ total: sum(schema.payments.amountCents) })
      .from(schema.payments)
      .where(eq(schema.payments.status, "paid")),
  ]);

  const totalMembers = byStatus.reduce((acc, row) => acc + row.total, 0);
  const active = byStatus.find((row) => row.status === "ACTIVE")?.total ?? 0;
  const pendingPayment =
    byStatus.find((row) => row.status === "PENDING_PAYMENT")?.total ?? 0;
  const collectedCents = Number(collected?.total ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Saison {season}</h1>
        <p className="mt-1 text-brand-dark/70">
          Cotisation annuelle : {formatEuros(feeCents)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Adhérentes" value={String(totalMembers)} />
        <Stat label="Adhésions validées" value={String(active)} />
        <Stat label="En attente de règlement" value={String(pendingPayment)} />
        <Stat label="Encaissé" value={formatEuros(collectedCents)} />
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold text-brand-dark">Effectifs par groupe</h2>
        <ul className="mt-4 space-y-3">
          {groups.map((group) => (
            <li key={group.key} className="flex items-baseline justify-between gap-4">
              <span>
                <strong className="text-brand-dark">{group.day}</strong>
                <span className="ml-2 text-sm text-brand-dark/60">
                  {group.time} — {group.place}
                </span>
              </span>
              <span className="text-lg font-semibold text-brand">
                {byGroup.find((row) => row.groupName === group.key)?.total ?? 0}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/adherentes" className="btn-ghost">
          Voir les adhérentes
        </Link>
        <Link href="/admin/presences" className="btn-ghost">
          Saisir les présences
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-sm text-brand-dark/60">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand-dark">{value}</p>
    </div>
  );
}
