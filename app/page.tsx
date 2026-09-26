import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AssoConnectForm } from "@/components/vitrine/assoconnect-form";
import { VitrineFooter } from "@/components/vitrine/page-shell";
import { HeroVideo, Motion, ScrollProgress } from "@/components/vitrine/motion";
import { Terrain } from "@/components/vitrine/terrain";
import "@/components/vitrine/vitrine.css";
import { ADHESION_QR_PATH, ADHESION_URL } from "@/lib/adhesion";
import { formatEurosCompact } from "@/lib/constants";
import { getAssociation, getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Reprise à l'identique dans la description, l'aperçu social et Twitter. */
const DESCRIPTION =
  "Club multisport pour les filles à Montpellier : foot, volley, basket, self-défense, cardio boxe. Un créneau par semaine, dans un cadre bienveillant, sans compétition. Inscriptions ouvertes.";

export const metadata: Metadata = {
  title: "Banat Sport Club — Enfin un club de sport pensé pour elles",
  description: DESCRIPTION,
  openGraph: {
    title: "Banat Sport Club — Enfin un club de sport pensé pour elles",
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Banat Sport Club — Enfin un club de sport pensé pour elles",
    description: DESCRIPTION,
  },
};

/**
 * Le texte s'adresse aux parents, du début à la fin.
 *
 * C'est le parent qui lit la page, qui inscrit et qui paie : lui dire « tu »
 * en parlant à sa fille, puis « vous » au moment de payer, brouille la lecture.
 * Une seule voix, donc — et les filles sont « elles ».
 *
 * Corollaire sur le fond : pas de double discours. Le club annonce qu'il n'y a
 * pas de compétition ; il ne faut pas reprendre d'une main ce qu'on donne de
 * l'autre en vantant l'intensité ou le fait de se mesurer aux autres. Un parent
 * doit savoir, en une lecture, où il met sa fille.
 */

const SPORTS = [
  "Football",
  "Volley",
  "Basket",
  "Self-défense",
  "Cardio boxe",
  "Circuit training",
  "Grands jeux collectifs",
];

const VALEURS = [
  "Débutante ou confirmée",
  "Entre filles",
  "Encadrées",
  "Sans compétition",
  "Le téléphone au vestiaire",
  "On s’encourage",
  "On s’entraide",
  "On grandit ensemble",
];

const BENEFICES = [
  {
    number: "01",
    title: "Bouger",
    text: "Du sport qui fait du bien, sans pression. Elles courent, elles jouent, elles repartent le sourire aux lèvres.",
  },
  {
    number: "02",
    title: "Prendre confiance",
    text: "Oser, essayer, progresser à son rythme. Sans classement, sans sélection, sans jugement.",
  },
  {
    number: "03",
    title: "Créer des liens",
    text: "Un vrai groupe, construit sur l’entraide et le respect. On arrive parfois seule, on repart avec des amies.",
  },
  {
    number: "04",
    title: "Déconnecter",
    text: "Le téléphone reste au vestiaire, le temps de la séance, pour être pleinement là, avec les autres.",
  },
];

/**
 * Ce qui rassure vraiment un parent.
 *
 * Rien ici n'est décoratif : chaque ligne correspond à quelque chose que le
 * club fait réellement — l'appel est saisi à chaque séance dans l'espace
 * bureau, et le message d'absence est prévu au règlement intérieur.
 */
const GARANTIES = [
  "Des séances encadrées par une équipe passionnée",
  "Un appel à chaque séance, et un message si votre fille est absente",
  "L’assurance du club",
  "Des lieux sportifs équipés, à Montpellier et Grabels",
];

const INCLUS = [
  { text: "L’accès à toutes les séances de la saison" },
  { text: "L’encadrement" },
  { text: "L’assurance du club" },
  {
    text: "Le kit BSC (sac, gourde, accessoires)",
    highlight: "Offert cette première saison",
  },
];

const REGLES = [
  "On respecte les autres.",
  "On s’encourage.",
  "On ne se moque pas.",
  "On ne juge pas.",
  "On arrive à l’heure.",
  "On s’entraide.",
  "On pose son téléphone.",
  "On profite du moment.",
];

/**
 * Adresse où le bureau reçoit les familles qui préfèrent s'inscrire de vive
 * voix. Distincte des lieux de séance : ce sont des bureaux, pas un gymnase.
 */
const RENDEZ_VOUS_ADRESSE =
  "Bureaux & Co – Parc 2000, 84 rue Maurice Béjart, 34080 Montpellier";

/** Ce que chaque lieu a de concret à offrir. */
const LIEUX: Record<string, string> = {
  jeudi:
    "Plus de 200 m² de tatamis : de la place pour bouger, jouer au ballon, tomber sans se faire mal et profiter pleinement de la séance.",
  dimanche:
    "Un vrai stade en plein air : de l’espace pour le foot, les grands jeux collectifs et tous les sports de plein air.",
};

/**
 * Vidéo de fond du hero.
 *
 * Aucune vidéo n'existe aujourd'hui : `public/videos/` est vide, et le fond
 * animé en CSS tient la page tout seul. On vérifie donc la présence du fichier
 * au moment du rendu plutôt que de poser une balise `<video>` en aveugle — qui
 * déclencherait deux 404 à chaque visite pour rien.
 *
 * Le dossier est déclaré dans `outputFileTracingIncludes` (next.config.ts),
 * sans quoi ce test répondrait toujours « non » en production.
 */
function heroVideoSources(): string[] {
  return ["hero.webm", "hero.mp4"]
    .filter((name) => existsSync(path.join(process.cwd(), "public", "videos", name)))
    .map((name) => `/videos/${name}`);
}

export default async function AccueilPage() {
  const [{ season, annualFeeCents, groups }, association] = await Promise.all([
    getSiteSettings(),
    getAssociation(),
  ]);

  const videoSources = heroVideoSources();
  const phoneHref = association.phone?.replace(/\s/g, "");

  return (
    <>
      <ScrollProgress />

      {/*
        En-tête réduit à une marque et un bouton. Une vitrine a un seul
        objectif : les liens de navigation ne feraient que proposer des sorties.
      */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-brand-dark/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo-bsc.png"
              alt=""
              width={512}
              height={512}
              priority
              className="h-9 w-9 shrink-0"
            />
            <span className="text-sm font-extrabold uppercase tracking-tight text-white sm:text-base">
              Banat Sport Club
            </span>
          </Link>
          <a
            href="#adherer"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white hover:text-brand-dark"
          >
            Réserver sa place
          </a>
        </div>
      </header>

      <Motion>
        <main>
          {/* 1 — Hero ------------------------------------------------------ */}
          <section className="bsc-grain relative isolate flex min-h-[88svh] items-center overflow-hidden bg-brand-dark">
            <div aria-hidden className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-[#3d0b1a]" />
              <div className="bsc-halo absolute -left-24 top-[-18%] h-[70vh] w-[70vh] rounded-full bg-brand/45 blur-[90px]" />
              <div className="bsc-halo bsc-halo--slow absolute -right-20 bottom-[-22%] h-[60vh] w-[60vh] rounded-full bg-brand-light/35 blur-[100px]" />
              <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/10 via-transparent to-brand-dark" />
              <div className="absolute inset-y-0 left-0 w-[45%] overflow-hidden">
                <div className="bsc-sweep h-full w-1/3 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
              </div>
            </div>

            {videoSources.length > 0 && (
              <div aria-hidden className="absolute inset-0 -z-10">
                <HeroVideo sources={videoSources} />
                <div className="absolute inset-0 bg-brand-dark/65" />
              </div>
            )}

            {/* Les deux lieux, posés comme deux tirages l'un sur l'autre. */}
            <div
              aria-hidden
              className="pointer-events-none absolute right-8 top-1/2 hidden w-[38%] max-w-md -translate-y-1/2 xl:right-16 lg:block"
            >
              {groups.slice(0, 2).map((group, index) => (
                <div
                  key={group.key}
                  className="overflow-hidden rounded-3xl border border-white/15 shadow-2xl shadow-black/40"
                  style={{
                    transform: `rotate(${index === 0 ? -3 : 2.5}deg)`,
                    marginTop: index === 0 ? 0 : "-1.5rem",
                    marginLeft: index === 0 ? 0 : "2rem",
                  }}
                >
                  <div className="relative h-44 xl:h-48">
                    <Terrain variant={group.key === "jeudi" ? "dojo" : "stade"} />
                    <div className="absolute inset-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent p-4">
                      <span>
                        <span className="block text-lg font-extrabold uppercase tracking-tight text-white">
                          {group.day}
                        </span>
                        <span className="mt-0.5 block text-xs font-semibold text-white/75">
                          {group.levels}
                        </span>
                      </span>
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-dark">
                        {group.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:py-28">
              <div data-reveal className="max-w-3xl lg:max-w-xl">
                <p className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.25em] text-brand-light">
                  <span aria-hidden className="relative flex h-2 w-2">
                    <span className="bsc-ping absolute inline-flex h-full w-full rounded-full bg-brand-light" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-light" />
                  </span>
                  Saison {season} — Montpellier
                </p>

                <h1 className="mt-5 text-[2.4rem] font-extrabold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Enfin un club de sport{" "}
                  <span className="text-brand-light">pensé pour elles.</span>
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
                  On a écouté leurs besoins, et on y répond : un club multisport
                  rien que pour les filles, pour apprendre, s’amuser et grandir
                  ensemble.
                </p>

                <div
                  data-reveal
                  style={{ ["--bsc-delay" as string]: "120ms" }}
                  className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <a
                    href="#adherer"
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand px-9 text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:bg-white hover:text-brand-dark"
                  >
                    Réserver sa place
                  </a>
                  <a
                    href="#creneaux"
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/30 px-7 text-base font-semibold text-white transition hover:bg-white/10"
                  >
                    Voir les créneaux
                  </a>
                </div>

                <p
                  data-reveal
                  style={{ ["--bsc-delay" as string]: "200ms" }}
                  className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70"
                >
                  <span>{formatEurosCompact(annualFeeCents)} l’année</span>
                  <span aria-hidden className="text-white/30">·</span>
                  <span>Paiement en plusieurs fois possible</span>
                  <span aria-hidden className="text-white/30">·</span>
                  <span>Kit BSC offert cette première saison</span>
                  <span aria-hidden className="text-white/30">·</span>
                  <span className="font-semibold text-brand-light">Places limitées</span>
                </p>

                <dl
                  data-reveal
                  style={{ ["--bsc-delay" as string]: "260ms" }}
                  className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 border-t border-white/15 pt-7 sm:grid-cols-3"
                >
                  {[
                    { k: "Rendez-vous", v: "Une fois par semaine" },
                    { k: "Niveau", v: "Débutante ou confirmée" },
                    { k: "Esprit", v: "Loisir et bienveillance" },
                  ].map((item) => (
                    <div key={item.k}>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-white/50">
                        {item.k}
                      </dt>
                      <dd className="mt-1 text-lg font-bold text-white">{item.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <a
              href="#creneaux"
              aria-label="Découvrir le club"
              className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 hover:text-white"
            >
              <span aria-hidden className="bsc-nudge block text-2xl leading-none">
                ↓
              </span>
            </a>
          </section>

          {/* 2 — Bandeaux défilants ---------------------------------------- */}
          <section
            aria-label="Les sports pratiqués et l’esprit du club"
            className="overflow-hidden border-y border-brand-light/40 bg-white py-5"
          >
            <Marquee items={SPORTS} />
            <Marquee items={VALEURS} reverse muted />
          </section>

          {/* 3 — Les sports --------------------------------------------------- */}
          <section className="border-b border-brand-light/40 bg-white py-20 sm:py-24">
            <div className="mx-auto max-w-4xl px-5 text-center">
              <p data-reveal className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                Les sports
              </p>
              <h2
                data-reveal
                className="mt-3 text-3xl font-extrabold tracking-tight text-brand-dark sm:text-5xl"
              >
                Pas besoin de choisir une seule discipline
              </h2>
              <p
                data-reveal
                style={{ ["--bsc-delay" as string]: "100ms" }}
                className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-brand-dark/80"
              >
                Foot, volley, basket, self-défense, cardio boxe, circuit
                training, grands jeux collectifs… et bien d’autres ! Le
                programme change au fil de l’année, pour que chacune découvre,
                teste et trouve ce qu’elle aime.
              </p>
            </div>
          </section>

          {/* 4 — Les créneaux ------------------------------------------------- */}
          <section id="creneaux" className="scroll-mt-16 py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-5">
              <div data-reveal className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  Les créneaux
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-dark sm:text-5xl">
                  Un créneau par semaine, rien que pour elles
                </h2>
                {/*
                  « Deux créneaux » se lisait comme « elle vient deux fois par
                  semaine ». La précision se glisse dans la phrase plutôt que de
                  s'imposer en gras : on informe, on ne rectifie pas.
                */}
                <p className="mt-4 text-lg text-brand-dark/75">
                  Deux créneaux cette saison, selon la classe de votre fille.
                  Une séance par semaine, toujours avec le même groupe, entre
                  filles et entre amies.
                </p>
              </div>

              <div className="mt-12 grid gap-6 lg:grid-cols-2">
                {groups.map((group, index) => (
                  <article
                    key={group.key}
                    data-reveal
                    style={{ ["--bsc-delay" as string]: `${index * 120}ms` }}
                    className="group overflow-hidden rounded-3xl border border-brand-light/50 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/10"
                  >
                    <div className="relative h-44 overflow-hidden sm:h-52">
                      <Terrain variant={group.key === "jeudi" ? "dojo" : "stade"} />
                      <div className="absolute inset-0 flex items-end justify-between gap-3 bg-gradient-to-t from-brand-dark/75 to-transparent p-5">
                        <p className="text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">
                          {group.day}
                        </p>
                        <p className="rounded-full bg-white/95 px-3.5 py-1.5 text-sm font-bold text-brand-dark">
                          {group.time}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 sm:p-7">
                      <p className="inline-flex rounded-full bg-brand-light/25 px-3.5 py-1.5 text-sm font-bold text-brand-dark">
                        Pour les {group.levels}
                      </p>
                      <p className="mt-4 text-lg font-semibold text-brand-dark">
                        {group.place}
                      </p>
                      <a
                        href={group.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-sm text-brand underline decoration-brand/40 underline-offset-2 hover:decoration-brand"
                      >
                        {group.address} — itinéraire
                      </a>
                      {LIEUX[group.key] && (
                        <p className="mt-4 border-t border-brand-light/40 pt-4 text-brand-dark/75">
                          {LIEUX[group.key]}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {/*
                Les tranches d'âge ne sont pas un mur : une fille peut se sentir
                mieux dans l'autre groupe. On le dit ici plutôt que de laisser
                la famille renoncer faute d'avoir demandé.
              */}
              <p data-reveal className="mt-6 text-brand-dark/75">
                Votre fille préfère l’autre créneau que celui prévu pour son
                âge ? Contactez-nous, on en discute
                {phoneHref ? (
                  <>
                    {" : "}
                    <a
                      href={`tel:${phoneHref}`}
                      className="font-semibold text-brand underline"
                    >
                      {association.phone}
                    </a>
                  </>
                ) : (
                  ""
                )}
                .
              </p>

              {/* 5 — Et en plus des séances de la semaine */}
              <div
                data-reveal
                className="mt-8 rounded-3xl border border-brand-light/60 bg-brand-light/15 p-6 sm:p-8"
              >
                <h3 className="text-xl font-bold tracking-tight text-brand-dark">
                  <span aria-hidden>✨</span> Et en plus des séances de la semaine
                </h3>
                <p className="mt-3 max-w-3xl leading-relaxed text-brand-dark/80">
                  Tout au long de l’année, d’autres activités sportives seront
                  proposées en dehors des créneaux réguliers : stages, sorties,
                  événements. Elles vous seront communiquées au fur et à mesure.
                </p>
              </div>
            </div>
          </section>

          {/* 6 — Ce qu'elles y gagnent ---------------------------------------- */}
          <section className="bsc-grain relative overflow-hidden bg-brand-dark py-20 text-white sm:py-24">
            <div
              aria-hidden
              className="bsc-halo absolute -right-32 top-1/4 h-[50vh] w-[50vh] rounded-full bg-brand/30 blur-[110px]"
            />
            <div className="relative mx-auto max-w-6xl px-5">
              <h2
                data-reveal
                className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl"
              >
                Ce qu’elles y gagnent
              </h2>

              <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2">
                {BENEFICES.map((item, index) => (
                  <div
                    key={item.title}
                    data-reveal
                    style={{ ["--bsc-delay" as string]: `${index * 90}ms` }}
                    className="bg-brand-dark p-7 transition hover:bg-[#6d1430] sm:p-9"
                  >
                    <span className="text-sm font-bold text-brand-light">
                      {item.number}
                    </span>
                    <h3 className="mt-2 text-2xl font-bold uppercase tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-white/75">{item.text}</p>
                  </div>
                ))}
              </div>

              <blockquote
                data-reveal
                className="mt-14 max-w-3xl border-l-4 border-brand pl-6 text-xl leading-relaxed text-brand-light sm:text-2xl"
              >
                « Se déconnecter des écrans pour se reconnecter à soi, aux autres
                et au mouvement. »
              </blockquote>
            </div>
          </section>

          {/* 7 — Pour les parents --------------------------------------------- */}
          <section className="bg-white py-20 sm:py-24">
            <div className="mx-auto max-w-5xl px-5">
              <div data-reveal className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  Pour les parents
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-dark sm:text-5xl">
                  Vous pouvez être tranquilles
                </h2>
              </div>

              <ul className="mt-10 grid gap-4 sm:grid-cols-2">
                {GARANTIES.map((item, index) => (
                  <li
                    key={item}
                    data-reveal
                    style={{ ["--bsc-delay" as string]: `${index * 80}ms` }}
                    className="flex items-start gap-4 rounded-2xl border border-brand-light/50 bg-cream p-5 font-medium text-brand-dark"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white"
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 8 — Les règles du jeu -------------------------------------------- */}
          <section className="py-20 sm:py-24">
            <div className="mx-auto max-w-5xl px-5">
              <h2
                data-reveal
                className="text-3xl font-extrabold tracking-tight text-brand-dark sm:text-5xl"
              >
                Les règles du jeu
              </h2>
              <p data-reveal className="mt-4 max-w-2xl text-lg text-brand-dark/75">
                Huit règles simples, pour que chacune se sente bien.
              </p>
              <ul className="mt-9 flex flex-wrap gap-2.5">
                {REGLES.map((regle, index) => (
                  <li
                    key={regle}
                    data-reveal
                    style={{ ["--bsc-delay" as string]: `${index * 45}ms` }}
                    className="rounded-full border border-brand-light/60 bg-white px-5 py-2.5 font-medium text-brand-dark transition hover:border-brand hover:bg-brand-light/15"
                  >
                    {regle}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 9 — Réserver sa place ------------------------------------------ */}
          <section id="adherer" className="scroll-mt-16 py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-5">
              {/*
                Placé AVANT le formulaire, et sur toute la largeur : une famille
                qui préfère venir sur place ne doit pas avoir à faire défiler
                quatre mille pixels de formulaire pour découvrir qu'un
                rendez-vous était possible.
              */}
              <div data-reveal className="mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-extrabold tracking-tight text-brand-dark sm:text-4xl">
                  Deux façons de vous inscrire
                </h2>
              </div>

              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <div
                  data-reveal
                  className="rounded-3xl border-2 border-brand-light/60 bg-white p-6 sm:p-7"
                >
                  <p className="text-lg font-bold text-brand-dark">
                    <span aria-hidden>💻</span> 100 % en ligne
                  </p>
                  <p className="mt-3 leading-relaxed text-brand-dark/80">
                    Remplissez le formulaire ci-dessous et réglez par carte
                    bancaire en quelques minutes.
                  </p>
                  <p className="mt-3 font-semibold text-brand-dark">
                    <span aria-hidden>💳</span> Paiement en plusieurs fois
                    possible, à choisir au moment de l’inscription.
                  </p>
                </div>

                <div
                  data-reveal
                  style={{ ["--bsc-delay" as string]: "100ms" }}
                  className="rounded-3xl border-2 border-brand-light/60 bg-white p-6 sm:p-7"
                >
                  <p className="text-lg font-bold text-brand-dark">
                    <span aria-hidden>🤝</span> Sur rendez-vous
                  </p>
                  <p className="mt-3 leading-relaxed text-brand-dark/80">
                    Vous préférez nous rencontrer ? Appelez-nous
                    {phoneHref ? (
                      <>
                        {" au "}
                        <a
                          href={`tel:${phoneHref}`}
                          className="font-semibold text-brand underline"
                        >
                          {association.phone}
                        </a>
                      </>
                    ) : (
                      " "
                    )}{" "}
                    pour fixer un rendez-vous dans nos locaux :
                  </p>
                  <p className="mt-3 flex gap-2 font-semibold text-brand-dark">
                    <span aria-hidden>📍</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        RENDEZ_VOUS_ADRESSE,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-brand/40 underline-offset-2 hover:decoration-brand"
                    >
                      {RENDEZ_VOUS_ADRESSE}
                    </a>
                  </p>
                  <p className="mt-3 leading-relaxed text-brand-dark/80">
                    On complète le dossier ensemble et vous pouvez régler en
                    espèces ou par chèque.
                  </p>
                </div>
              </div>

              <div className="mt-14 grid items-start gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
                {/*
                  Le formulaire AssoConnect fait plusieurs milliers de pixels de
                  haut. Sans `sticky`, le prix et le QR code défilent hors de vue
                  dès la première question et la colonne paraît abandonnée.
                */}
                <div data-reveal className="lg:sticky lg:top-20 lg:self-start">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                    Inscriptions ouvertes — {season}
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-dark sm:text-5xl">
                    Réservez la place de votre fille
                  </h2>

                  <p className="mt-7 flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold tracking-tight text-brand-dark sm:text-6xl">
                      {formatEurosCompact(annualFeeCents)}
                    </span>
                    <span className="text-lg font-semibold text-brand-dark/60">
                      pour l’année
                    </span>
                  </p>
                  <p className="mt-2 font-semibold text-brand">
                    Paiement en plusieurs fois possible.
                  </p>

                  <ul className="mt-7 space-y-3">
                    {INCLUS.map((item) => (
                      <li key={item.text} className="flex gap-3 text-brand-dark/85">
                        <span aria-hidden className="mt-0.5 font-bold text-brand">
                          ✓
                        </span>
                        <span>
                          {item.text}
                          {item.highlight && (
                            <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                              {item.highlight}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-6 rounded-xl border border-brand-light/60 bg-brand-light/15 px-4 py-3 text-sm font-semibold text-brand-dark">
                    Première saison : les places sont limitées.
                  </p>

                  <div className="mt-8 rounded-2xl border border-brand-light/50 bg-cream p-5">
                    <div className="flex items-start gap-4">
                      <Image
                        src={ADHESION_QR_PATH}
                        alt="QR code vers le formulaire d’inscription"
                        width={112}
                        height={112}
                        className="h-28 w-28 shrink-0 rounded-lg bg-white p-1.5"
                        unoptimized
                      />
                      <div>
                        <p className="font-bold text-brand-dark">
                          À afficher, à partager
                        </p>
                        <p className="mt-1 text-sm text-brand-dark/70">
                          Ce QR code mène directement au formulaire. Utilisable
                          sur une affiche, un flyer ou en story.
                        </p>
                        <a
                          href={ADHESION_QR_PATH}
                          download
                          className="mt-2 inline-block text-sm font-semibold text-brand underline"
                        >
                          Télécharger le QR code
                        </a>
                      </div>
                    </div>
                  </div>

                  <p className="mt-7 text-sm text-brand-dark/70">
                    Une question ?{" "}
                    <a
                      href={`mailto:${association.email}`}
                      className="font-semibold text-brand underline"
                    >
                      {association.email}
                    </a>
                    {phoneHref && (
                      <>
                        {" · "}
                        <a
                          href={`tel:${phoneHref}`}
                          className="font-semibold text-brand underline"
                        >
                          {association.phone}
                        </a>
                      </>
                    )}
                  </p>
                </div>

                <div data-reveal style={{ ["--bsc-delay" as string]: "120ms" }}>
                  <AssoConnectForm />
                </div>
              </div>
            </div>
          </section>

          {/* 10 — Appel final ------------------------------------------------ */}
          <section className="bsc-grain relative overflow-hidden bg-brand py-16 text-center text-white">
            <div
              aria-hidden
              className="bsc-halo absolute inset-x-0 top-0 mx-auto h-[40vh] w-[40vh] rounded-full bg-white/20 blur-[90px]"
            />
            <div className="relative mx-auto max-w-2xl px-5">
              <h2 data-reveal className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Première saison : les places sont limitées
              </h2>
              <p data-reveal className="mt-4 text-lg text-white/85">
                Réservez dès maintenant la place de votre fille.
              </p>
              <a
                data-reveal
                href={ADHESION_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex min-h-14 items-center justify-center rounded-2xl bg-white px-8 text-base font-bold text-brand-dark transition hover:-translate-y-0.5 hover:bg-brand-dark hover:text-white"
              >
                Inscrire ma fille
              </a>
            </div>
          </section>
        </main>
      </Motion>

      <VitrineFooter />
    </>
  );
}

/**
 * Bandeau défilant.
 *
 * La liste est écrite deux fois et l'animation ne parcourt que la moitié de la
 * piste : la seconde copie arrive pile où était la première, donc aucune
 * coupure. La copie est masquée aux lecteurs d'écran pour ne pas lire deux fois
 * la même chose.
 */
function Marquee({
  items,
  reverse,
  muted,
}: {
  items: string[];
  reverse?: boolean;
  muted?: boolean;
}) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li
          key={item}
          className={`flex items-center whitespace-nowrap px-5 text-lg font-extrabold uppercase tracking-tight sm:text-2xl ${
            muted ? "text-brand-dark/35" : "text-brand-dark"
          }`}
        >
          {item}
          <span aria-hidden className="ml-5 text-brand-light">
            ●
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex overflow-hidden">
      <div className={`bsc-marquee-track ${reverse ? "bsc-marquee-track--reverse" : ""}`}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
