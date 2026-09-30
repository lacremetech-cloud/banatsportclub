import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { VitrineFooter } from "@/components/vitrine/page-shell";
import { HeroVideo, Motion, ScrollProgress } from "@/components/vitrine/motion";
import { PhotoFond, PhotoLieu } from "@/components/vitrine/photo-lieu";
import "@/components/vitrine/vitrine.css";
import { ADHESION_URL } from "@/lib/adhesion";
import {
  CURRENT_SCHEDULE,
  CURRENT_SCHEDULE_MAPS_URL,
  formatEurosCompact,
  mapsUrl,
  RENDEZ_VOUS,
  RENDEZ_VOUS_FULL,
} from "@/lib/constants";
import { getAssociation, getSiteSettings } from "@/lib/settings";
import { rendezVousSms, smsHref } from "@/lib/sms";

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

/**
 * Les sports, avec le pictogramme qui va avec.
 *
 * Une seule liste sert aux deux usages : la grille colorée de la section « Les
 * sports » et le bandeau défilant du haut de page. Écrire les noms deux fois,
 * c'était se garantir qu'un ajout finisse par ne figurer qu'à un seul endroit.
 *
 * Les pictogrammes sont décoratifs — ils sont masqués aux lecteurs d'écran, qui
 * annonceraient sinon « ballon de football » avant de lire « Football ».
 */
const SPORTS_DETAIL = [
  { emoji: "⚽", name: "Football" },
  { emoji: "🥋", name: "Self-défense" },
  { emoji: "🏐", name: "Volley" },
  { emoji: "🥊", name: "Cardio boxe" },
  { emoji: "💪", name: "Circuit training" },
  { emoji: "🥎", name: "Jeux de balle" },
];

const SPORTS = SPORTS_DETAIL.map((sport) => sport.name);

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

/**
 * Les quatre bénéfices.
 *
 * Le pictogramme n'est pas une décoration : c'est lui qui donne à la section
 * un point d'accroche ailleurs que dans le texte. Sans lui, quatre pavés de
 * bordeaux sur bordeaux se lisaient comme un tableau.
 */
const BENEFICES = [
  {
    number: "01",
    emoji: "⚡",
    title: "Bouger",
    text: "Du sport qui fait du bien, sans pression. Elles courent, elles jouent, elles repartent le sourire aux lèvres.",
  },
  {
    number: "02",
    emoji: "🌟",
    title: "Prendre confiance",
    text: "Oser, essayer, progresser à son rythme. Sans classement, sans sélection, sans jugement.",
  },
  {
    number: "03",
    emoji: "🤝",
    title: "Créer des liens",
    text: "Un vrai groupe, construit sur l’entraide et le respect. On arrive parfois seule, on repart avec des amies.",
  },
  {
    number: "04",
    emoji: "🎒",
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
  "Un lieu sportif équipé, à Montpellier",
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
  const [{ season, annualFeeCents }, association] = await Promise.all([
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

              {/*
                Une photo derrière le titre, là où il n'y avait qu'un dégradé.
                Elle est largement voilée : on ne doit pas la regarder, on doit
                sentir qu'il y a une salle derrière les mots. Les halos roses
                passent par dessus et la ramènent aux couleurs du club.

                Uniquement en l'absence de vidéo : les deux fonds se
                superposeraient sans qu'aucun ne se lise.
              */}
              {videoSources.length === 0 && (
                <div className="absolute inset-0">
                  <PhotoFond variant="dojo" className="bsc-kenburns" />
                  {/*
                    La photo du dojo est bien plus claire que la pelouse de nuit
                    qu'elle remplace : à voile égal, elle éclaircissait tout le
                    hero et on lisait la trame du faux plafond derrière le titre.
                  */}
                  <div className="absolute inset-0 bg-brand-dark/[0.92]" />
                </div>
              )}

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

            {/*
              Le lieu des séances, posé à droite du titre.

              Il y avait ici deux tirages superposés, un par créneau. Le club
              n'en ouvre plus qu'un : il ne reste que celui du jeudi, à
              l'identique.
            */}
            <div
              aria-hidden
              className="pointer-events-none absolute right-6 top-1/2 hidden w-[42%] max-w-lg -translate-y-1/2 xl:right-12 lg:block"
            >
              <div className="overflow-hidden rounded-3xl border border-white/20 shadow-2xl shadow-black/40">
                <div className="relative h-72 overflow-hidden xl:h-80">
                  <PhotoLieu
                    variant="dojo"
                    // Pas de `priority` : ce cadre n'existe qu'à partir de
                    // `lg`, et le préchargement, lui, ne connaît pas les
                    // points de rupture — sur téléphone il ferait télécharger
                    // une image jamais affichée.
                    sizes="(min-width: 1280px) 32rem, 40vw"
                    className="bsc-kenburns"
                  />
                  <div className="absolute inset-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent p-4">
                    <span>
                      <span className="block text-lg font-extrabold uppercase tracking-tight text-white">
                        {CURRENT_SCHEDULE.day}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold text-white/75">
                        {CURRENT_SCHEDULE.levels}
                      </span>
                    </span>
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-dark">
                      {CURRENT_SCHEDULE.time}
                    </span>
                  </div>
                </div>
              </div>
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

                <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">
                  Un club multisport rien que pour les filles, pour bouger,
                  s’amuser et se retrouver.
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
                    Voir le créneau
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

                {/*
                  Le tirage du hero est posé à droite du titre, une place qui
                  n'existe pas sur un téléphone — et c'est sur téléphone que la
                  page sera surtout lue. Ce rappel en donne un aperçu là où il y
                  a la place, sous les chiffres.

                  Décoratif : le jour et le lieu sont dits en toutes lettres
                  quelques écrans plus bas. Un lecteur d'écran n'a pas besoin
                  de les entendre deux fois.
                */}
                <div
                  aria-hidden
                  data-reveal
                  style={{ ["--bsc-delay" as string]: "320ms" }}
                  className="relative mt-10 h-44 overflow-hidden rounded-2xl border border-white/20 sm:h-52 lg:hidden"
                >
                  <PhotoLieu variant="dojo" sizes="100vw" />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4">
                    <span className="text-sm font-extrabold uppercase tracking-tight text-white">
                      {CURRENT_SCHEDULE.day} · {CURRENT_SCHEDULE.time}
                    </span>
                  </div>
                </div>
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
                Foot, self-défense, volley, cardio boxe, circuit training,
                jeux de balle… et bien d’autres ! Le programme change au fil de
                l’année, pour que chacune découvre, teste et trouve ce qu’elle
                aime.
              </p>
            </div>

            {/*
              La liste était jusqu'ici une phrase, et une phrase se survole. En
              pastilles, chaque sport devient une chose qu'on peut regarder une
              par une — c'est là que se joue l'envie.

              Six disciplines, puis l'ouverture. Celle-ci s'étale sur la place
              qui reste — deux colonnes sur quatre, trois sur trois, deux sur
              deux —, donc aucune rangée orpheline quelle que soit la largeur.
            */}
            <ul className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 px-5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {SPORTS_DETAIL.map((sport, index) => (
                <li
                  key={sport.name}
                  data-reveal
                  style={{ ["--bsc-delay" as string]: `${index * 60}ms` }}
                  className="group flex flex-col items-center gap-2.5 rounded-2xl border border-brand-light/50 bg-cream px-3 py-6 text-center transition hover:-translate-y-1 hover:border-brand hover:bg-brand-light/20 hover:shadow-lg hover:shadow-brand/10"
                >
                  <span
                    aria-hidden
                    className="text-4xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                  >
                    {sport.emoji}
                  </span>
                  <span className="text-sm font-bold text-brand-dark sm:text-base">
                    {sport.name}
                  </span>
                </li>
              ))}
              <li
                data-reveal
                style={{ ["--bsc-delay" as string]: `${SPORTS_DETAIL.length * 60}ms` }}
                className="col-span-2 flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-brand px-3 py-6 text-center text-white sm:col-span-3 lg:col-span-2"
              >
                <span aria-hidden className="text-4xl">
                  ✨
                </span>
                <span className="text-sm font-bold sm:text-base">
                  Et bien d’autres
                </span>
              </li>
            </ul>
          </section>

          {/* 4 — Le créneau --------------------------------------------------- */}
          <section id="creneaux" className="scroll-mt-16 py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-5">
              <div data-reveal className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  Le créneau
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-dark sm:text-5xl">
                  Un créneau par semaine, rien que pour elles
                </h2>
                <p className="mt-4 text-lg text-brand-dark/75">
                  Un créneau au Complexe sportif des Garrigues, pour se dépenser
                  entre filles et entre amies. Une séance par semaine, toujours
                  avec le même groupe.
                </p>
              </div>

              {/*
                La carte de l'affiche : la photo d'un côté, l'essentiel de
                l'autre, dans l'ordre où une famille cherche — quand, pour qui,
                où, dans quoi.

                Pleine largeur : le club n'ouvre plus qu'un créneau, et une
                carte laissée à mi-largeur donnerait l'impression qu'il en
                manque une seconde.
              */}
              <article
                data-reveal
                className="group mt-12 overflow-hidden rounded-3xl border border-brand-light/50 bg-white shadow-sm transition hover:shadow-xl hover:shadow-brand/10 lg:grid lg:grid-cols-[1.25fr_1fr]"
              >
                <div className="relative h-64 overflow-hidden sm:h-80 lg:h-full lg:min-h-[27rem]">
                  <PhotoLieu
                    variant="dojo"
                    sizes="(min-width: 1024px) 40rem, 100vw"
                    className="transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-black/30 p-5">
                    <span className="self-start rounded-full bg-brand px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-black/20">
                      <span aria-hidden>🗓</span> {CURRENT_SCHEDULE.badge}
                    </span>
                    <span className="self-start rounded-full bg-white/95 px-4 py-1.5 text-sm text-brand-dark shadow-lg shadow-black/20">
                      <span aria-hidden>📍</span>{" "}
                      <strong className="font-bold">{CURRENT_SCHEDULE.city}</strong>
                      {", "}
                      {CURRENT_SCHEDULE.district}
                    </span>
                  </div>
                </div>

                <div className="p-7 sm:p-9 lg:flex lg:flex-col lg:justify-center">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                    {CURRENT_SCHEDULE.heading}
                  </p>
                  <p className="mt-2 text-4xl font-extrabold tracking-tight text-brand-dark sm:text-5xl">
                    {CURRENT_SCHEDULE.time}
                  </p>
                  {/*
                    Une séance n'est pas une porte qui claque : les familles qui
                    viennent de loin ont besoin de savoir qu'on peut arriver un
                    peu avant et repartir un peu après.
                  */}
                  <p className="mt-2.5 flex items-start gap-2 text-brand-dark/75">
                    <span aria-hidden className="mt-0.5">🕐</span>
                    <span>
                      Arrivée dès{" "}
                      <strong className="font-bold text-brand-dark">
                        {CURRENT_SCHEDULE.arrival}
                      </strong>{" "}
                      · départ à{" "}
                      <strong className="font-bold text-brand-dark">
                        {CURRENT_SCHEDULE.departure}
                      </strong>
                    </span>
                  </p>

                  <p className="mt-6 text-2xl font-extrabold tracking-tight text-brand-dark sm:text-3xl">
                    {CURRENT_SCHEDULE.levelsLong}
                  </p>

                  <div className="mt-6 space-y-4">
                    <p className="flex items-start gap-3">
                      <span aria-hidden className="mt-0.5">📍</span>
                      <span>
                        <span className="block font-bold text-brand-dark">
                          {CURRENT_SCHEDULE.place}
                        </span>
                        <a
                          href={CURRENT_SCHEDULE_MAPS_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-brand underline decoration-brand/40 underline-offset-2 hover:decoration-brand"
                        >
                          {CURRENT_SCHEDULE.address} — itinéraire
                        </a>
                      </span>
                    </p>
                    <p className="flex items-start gap-3 font-medium text-brand-dark/85">
                      <span aria-hidden className="mt-0.5">🥋</span>
                      <span>{CURRENT_SCHEDULE.venue}</span>
                    </p>
                  </div>
                </div>
              </article>

              {/*
                Un créneau unique ne veut pas dire un cadre rigide : une
                situation particulière se règle par téléphone, pas en
                renonçant.
              */}
              <p data-reveal className="mt-6 text-brand-dark/75">
                Une question ou une situation particulière ? Contactez-nous
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

              {/*
                Quatre pavés bordeaux séparés d'un trait sur un fond bordeaux :
                la grille se lisait comme un tableau, et le ton sur ton rendait
                la section terne alors qu'elle dit le plus beau de ce que le
                club apporte.

                Trois changements, tous dans la palette du club : des cartes
                détachées plutôt qu'une grille sans joints, un pictogramme posé
                sur un carré rose — la seule vraie rupture de couleur possible
                sur ce fond — et une citation qui devient un bloc rose plein.
              */}
              <div className="mt-12 grid gap-5 sm:grid-cols-2">
                {BENEFICES.map((item, index) => (
                  <div
                    key={item.title}
                    data-reveal
                    style={{ ["--bsc-delay" as string]: `${index * 90}ms` }}
                    className="rounded-3xl border border-white/15 bg-white/[0.07] p-7 transition hover:-translate-y-1 hover:border-brand-light/60 hover:bg-white/[0.12] sm:p-9"
                  >
                    <span
                      aria-hidden
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl shadow-lg shadow-brand/30"
                    >
                      {item.emoji}
                    </span>
                    <span className="mt-6 block text-sm font-bold text-brand-light">
                      {item.number}
                    </span>
                    <h3 className="mt-1 text-2xl font-bold uppercase tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-white/75">{item.text}</p>
                  </div>
                ))}
              </div>

              <blockquote
                data-reveal
                className="mt-12 rounded-3xl bg-brand p-8 text-xl font-semibold leading-relaxed text-white shadow-xl shadow-brand/20 sm:p-10 sm:text-2xl"
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
              <div data-reveal className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  Inscriptions ouvertes — {season}
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-dark sm:text-4xl">
                  Deux façons de vous inscrire
                </h2>
              </div>

              {/*
                Les deux cartes sont cliquables en entier.
                                
                Le lien porte un texte visible ET un `::after` en `absolute
                inset-0` qui couvre la carte : la zone cliquable fait toute la
                carte, tout en gardant un intitulé lisible par un lecteur
                d'écran. Les liens internes (téléphone, adresse) passent au
                dessus avec `relative z-10`, sinon la nappe les avalerait —
                imbriquer un lien dans un lien serait invalide.
              */}
              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <div
                  data-reveal
                  className="relative flex flex-col rounded-3xl border-2 border-brand-light/60 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg hover:shadow-brand/10 focus-within:border-brand sm:p-7"
                >
                  <p className="text-lg font-bold text-brand-dark">
                    <span aria-hidden>💻</span> 100 % en ligne
                  </p>
                  <p className="mt-3 leading-relaxed text-brand-dark/80">
                    Remplissez le formulaire en ligne et réglez en quelques
                    minutes.
                  </p>
                  {/*
                    La restriction est dite ici plutôt qu'au bout du parcours :
                    une famille qui règle par chèque doit l'apprendre avant de
                    remplir le formulaire, pas en arrivant sur la page de
                    paiement.
                  */}
                  <p className="mt-3 font-semibold text-brand-dark">
                    <span aria-hidden>💳</span> Paiement en ligne uniquement par
                    carte bancaire. Paiement en plusieurs fois possible, à
                    choisir au moment de l’inscription.
                  </p>
                  {/*
                    Nouvel onglet : la famille qui hésite retrouve la page du
                    club derrière elle, avec le téléphone et l'adresse.
                  */}
                  <a
                    href={ADHESION_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 self-start font-bold text-brand underline decoration-brand/40 underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:decoration-brand"
                  >
                    Aller au formulaire
                    <span aria-hidden>→</span>
                  </a>
                </div>

                <div
                  data-reveal
                  style={{ ["--bsc-delay" as string]: "100ms" }}
                  className="relative flex flex-col rounded-3xl border-2 border-brand-light/60 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg hover:shadow-brand/10 focus-within:border-brand sm:p-7"
                >
                  <p className="text-lg font-bold text-brand-dark">
                    <span aria-hidden>🤝</span> Sur rendez-vous
                  </p>
                  <p className="mt-3 leading-relaxed text-brand-dark/80">
                    Vous préférez nous rencontrer ? Écrivez-nous ou appelez-nous
                    {phoneHref ? (
                      <>
                        {" au "}
                        <a
                          href={`tel:${phoneHref}`}
                          className="relative z-10 font-semibold text-brand underline"
                        >
                          {association.phone}
                        </a>
                      </>
                    ) : (
                      " "
                    )}{" "}
                    pour fixer un rendez-vous dans nos locaux :
                  </p>
                  <p className="relative z-10 mt-3 flex gap-2 font-semibold text-brand-dark">
                    <span aria-hidden>📍</span>
                    <a
                      href={mapsUrl(RENDEZ_VOUS.place, RENDEZ_VOUS.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-brand/40 underline-offset-2 hover:decoration-brand"
                    >
                      {RENDEZ_VOUS_FULL}
                    </a>
                  </p>
                  <p className="mt-3 leading-relaxed text-brand-dark/80">
                    On complète le dossier ensemble. Pour un règlement par
                    chèque ou en espèces, contactez-nous afin de convenir d’un
                    règlement en présentiel.
                  </p>
                  {association.phone && (
                    <a
                      href={smsHref(association.phone, rendezVousSms())}
                      className="mt-5 inline-flex items-center gap-2 self-start font-bold text-brand underline decoration-brand/40 underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:decoration-brand"
                    >
                      Demander un rendez-vous par SMS
                      <span aria-hidden>→</span>
                    </a>
                  )}
                </div>
              </div>

              {/*
                Le récapitulatif de l'offre, puis le bouton.

                Le formulaire AssoConnect était auparavant intégré ici, dans un
                iframe. Il tenait mal dans un cadre — double barre de
                défilement, étape de paiement à l'étroit — et l'inscription est
                trop importante pour se jouer dans un compromis d'affichage.
                Elle se fait désormais toujours chez AssoConnect, en pleine
                page. Il ne reste donc de ce côté que ce qui donne envie de
                cliquer : le prix, ce qu'il comprend, et le bouton.
              */}
              <div
                data-reveal
                className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl border-2 border-brand-light/60 bg-white"
              >
                <div className="grid gap-9 p-7 sm:p-10 md:grid-cols-2 md:gap-12">
                  <div>
                    <p className="flex items-baseline gap-2">
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

                    <a
                      href={ADHESION_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-7 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-8 text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:bg-brand-dark"
                    >
                      Réserver la place de votre fille
                      <span aria-hidden>→</span>
                    </a>
                    <p className="mt-3 text-sm text-brand-dark/60">
                      Le formulaire et le paiement sont gérés par AssoConnect.
                      Le lien s’ouvre dans un nouvel onglet.
                    </p>
                  </div>

                  <ul className="space-y-3">
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
                </div>

                <p className="border-t border-brand-light/50 bg-brand-light/15 px-7 py-4 text-sm font-semibold text-brand-dark sm:px-10">
                  Première saison : les places sont limitées.
                </p>
              </div>

              <p data-reveal className="mt-8 text-center text-sm text-brand-dark/70">
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
