import Image from "next/image";
import Link from "next/link";

import { CLUB_EMAIL } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-brand-light/40 bg-white">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-bsc.png"
            alt=""
            width={512}
            height={512}
            className="h-12 w-12 shrink-0"
          />
          <div>
            <p className="text-base font-extrabold uppercase tracking-tight text-brand-dark">
              Banat Sport Club
            </p>
            <p className="text-brand">Remettre les filles en jeu</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-brand-dark/70">
          Association multisport loisir féminine — Montpellier
        </p>
        <a
          href={`mailto:${CLUB_EMAIL}`}
          className="mt-1 inline-block text-sm text-brand-dark/70 underline"
        >
          {CLUB_EMAIL}
        </a>

        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-brand-dark/70">
          <Link href="/informations" className="hover:underline">
            Informations pratiques
          </Link>
          <Link href="/reglement" className="hover:underline">
            Règlement intérieur
          </Link>
          <Link href="/inscription" className="hover:underline">
            S’inscrire
          </Link>
          <Link href="/admin" className="hover:underline">
            Espace bureau
          </Link>
        </div>
      </div>
    </footer>
  );
}
