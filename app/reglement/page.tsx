import type { Metadata } from "next";

import { PageShell, VitrineFooter } from "@/components/vitrine/page-shell";
import { REGLEMENT_PDF_PATH } from "@/lib/reglement";

import { ARTICLES, HEADER, PREAMBLE, type Block } from "./reglement-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Règlement intérieur — Banat Sport Club",
  description:
    "Règlement intérieur officiel de Banat Sport Club, saison 2026 – 2027.",
};

/**
 * Reprise fidèle du règlement intérieur officiel.
 *
 * Le texte vient de ./reglement-content.ts, transcrit mot pour mot depuis le
 * PDF servi depuis public/. Rien n'est reformulé ni ajouté ici : la page et le
 * PDF joint à l'email de confirmation doivent dire exactement la même chose.
 */
export default function ReglementPage() {
  return (
    <>
      <PageShell
        eyebrow={HEADER.legal}
        title="Règlement intérieur"
        intro={
          <>
            <p>{HEADER.season}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={REGLEMENT_PDF_PATH}
                download
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-6 text-sm font-bold text-white transition hover:bg-white hover:text-brand-dark"
              >
                Télécharger le PDF
              </a>
              <a
                href={REGLEMENT_PDF_PATH}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ouvrir dans un onglet
              </a>
            </div>
          </>
        }
      >
        <p className="leading-relaxed text-brand-dark/80">{PREAMBLE}</p>

        <div className="mt-10 space-y-9">
          {ARTICLES.map((article) => (
            <article key={article.title}>
              <h2 className="text-xl font-bold tracking-tight text-brand-dark">
                {article.title}
              </h2>
              <div className="mt-3 space-y-3">
                {article.blocks.map((block, index) => (
                  <BlockView key={index} block={block} />
                ))}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-12 border-t border-brand-light/40 pt-6 text-sm text-brand-dark/60">
          En cas de divergence, le PDF officiel fait foi.
        </p>
      </PageShell>

      <VitrineFooter />
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.kind === "highlight") {
    return (
      <p className="rounded-xl border border-brand-light/60 bg-brand-light/15 px-4 py-3 font-semibold text-brand-dark">
        {block.text}
      </p>
    );
  }

  if (block.kind === "list") {
    return (
      <ul className="space-y-1.5">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3 text-brand-dark/80">
            <span aria-hidden className="mt-0.5 text-brand">
              •
            </span>
            {item}
          </li>
        ))}
      </ul>
    );
  }

  return <p className="leading-relaxed text-brand-dark/80">{block.text}</p>;
}
