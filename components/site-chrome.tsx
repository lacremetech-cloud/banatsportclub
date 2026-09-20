import Link from "next/link";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/informations", label: "Informations" },
  { href: "/inscription", label: "Inscription" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-brand-light/40 bg-white">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-brand-dark">
          Banat Sport Club
        </Link>
        <nav className="flex items-center gap-1 text-sm">
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
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-brand-light/40 bg-white">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-sm text-brand-dark/70">
        <p>Banat Sport Club — association sportive féminine, Montpellier.</p>
        <Link href="/admin" className="hover:underline">
          Espace bureau
        </Link>
      </div>
    </footer>
  );
}
