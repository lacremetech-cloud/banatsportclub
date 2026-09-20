import Link from "next/link";

import { logout } from "@/app/admin/login/actions";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/adherentes", label: "Adhérentes" },
  { href: "/admin/paiements", label: "Paiements" },
  { href: "/admin/presences", label: "Présences" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="min-h-screen">
      <header className="border-b border-brand-light/40 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/admin" className="text-lg font-bold text-brand-dark">
              Banat Sport Club · Bureau
            </Link>
            <form action={logout} className="flex items-center gap-3">
              <span className="text-sm text-brand-dark/60">{session.email}</span>
              <button type="submit" className="btn-ghost">
                Déconnexion
              </button>
            </form>
          </div>
          <nav className="mt-3 flex flex-wrap gap-1 text-sm">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 font-medium text-brand-dark hover:bg-brand-light/20"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
