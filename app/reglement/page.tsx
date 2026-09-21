import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { REGLEMENT_PDF_PATH } from "@/lib/reglement";

import { ARTICLES, HEADER, PREAMBLE, type Block } from "./reglement-content";

export const metadata = {
  title: "Règlement intérieur — Banat Sport Club",
  description:
    "Règlement intérieur officiel de Banat Sport Club, saison 2026 – 2027.",
};

/**
 * Reprise fidèle du règlement intérieur officiel. Le texte vient de
 * ./reglement-content.ts, transcrit mot pour mot depuis le PDF officiel
 * servi depuis public/. Rien n'est reformulé ni ajouté ici.
 */
export default function ReglementPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-5 py-12">
        <header>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-brand">
            {HEADER.organisation}
          </p>
          <p className="mt-1 text-sm text-brand-dark/60">{HEADER.legal}</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
            {HEADER.title}
          </h1>
          <p className="mt-2 text-lg text-brand-dark/75">{HEADER.season}</p>
        </header>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href={REGLEMENT_PDF_PATH} download className="btn w-full sm:w-auto">
            Télécharger le règlement intérieur
          </a>
          <a
            href={REGLEMENT_PDF_PATH}
            target="_blank"
            rel="noopener"
            className="btn-ghost w-full justify-center py-3 sm:w-auto"
          >
            Ouvrir le PDF officiel
          </a>
        </div>

        <p className="mt-8 leading-relaxed text-brand-dark/80">{PREAMBLE}</p>

        <div className="mt-10 space-y-9">
          {ARTICLES.map((article) => (
            <article key={article.title}>
              <h2 className="text-xl font-bold text-brand-dark">
                {article.title}
              </h2>
              <div className="mt-3 space-y-3">
                {article.blocks.map((block, index) => (
                  <ContentBlock key={index} block={block} />
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <Link href="/inscription" className="btn w-full sm:w-auto">
            S’inscrire au club
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function ContentBlock({ block }: { block: Block }) {
  if (block.kind === "list") {
    return (
      <ul className="space-y-2">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3 leading-relaxed text-brand-dark/80">
            <span aria-hidden className="text-brand">
              •
            </span>
            {item}
          </li>
        ))}
      </ul>
    );
  }

  if (block.kind === "highlight") {
    return (
      <p className="rounded-xl bg-brand-light/20 px-4 py-3 text-lg font-bold text-brand-dark">
        {block.text}
      </p>
    );
  }

  return <p className="leading-relaxed text-brand-dark/80">{block.text}</p>;
}
