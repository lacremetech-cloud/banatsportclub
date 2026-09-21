import Image from "next/image";
import Link from "next/link";

import { logout } from "@/app/admin/login/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="min-h-screen">
      <header className="border-b border-brand-light/40 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Image
                src="/logo-bsc.png"
                alt=""
                width={512}
                height={512}
                className="h-9 w-9 shrink-0"
              />
              <span className="text-base font-extrabold uppercase tracking-tight text-brand-dark">
                Banat Sport Club · Bureau
              </span>
            </Link>
            <form action={logout} className="flex items-center gap-3">
              <span className="hidden text-sm text-brand-dark/60 sm:inline">
                {session.email}
              </span>
              <button type="submit" className="btn-ghost">
                Déconnexion
              </button>
            </form>
          </div>
          <AdminNav />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6 sm:py-8">{children}</main>
    </div>
  );
}
