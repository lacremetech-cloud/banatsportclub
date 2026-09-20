"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/adherentes", label: "Adhérentes" },
  { href: "/admin/paiements", label: "Paiements" },
  { href: "/admin/presences", label: "Présences" },
];

/**
 * Navigation du bureau. Sur mobile elle défile horizontalement plutôt que de
 * se replier dans un menu : quatre entrées, autant les garder visibles.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-5 mt-3 overflow-x-auto px-5">
      <ul className="flex min-w-max gap-1">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand text-white"
                    : "text-brand-dark hover:bg-brand-light/20"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
