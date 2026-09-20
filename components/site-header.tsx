"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "/#le-club", label: "Le club" },
  { href: "/#mission", label: "Notre mission" },
  { href: "/#creneaux", label: "Créneaux" },
  { href: "/informations", label: "Infos" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-brand-light/40 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <Link
          href="/"
          className="text-base font-extrabold uppercase tracking-tight text-brand-dark sm:text-lg"
          onClick={() => setOpen(false)}
        >
          Banat Sport Club
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-brand-dark hover:bg-brand-light/20"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/inscription" className="btn ml-2 px-5 py-2.5 text-sm">
            S’inscrire
          </Link>
        </nav>

        <button
          type="button"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-brand-dark md:hidden"
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden className="text-2xl leading-none">
            {open ? "✕" : "☰"}
          </span>
        </button>
      </div>

      {open && (
        <nav className="border-t border-brand-light/40 bg-white px-5 pb-4 md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block border-b border-brand-light/20 py-4 text-base font-medium text-brand-dark"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/inscription"
            className="btn mt-4 w-full"
            onClick={() => setOpen(false)}
          >
            S’inscrire
          </Link>
        </nav>
      )}
    </header>
  );
}
