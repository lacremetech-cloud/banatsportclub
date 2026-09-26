import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { ADHESION_QR_PATH, ADHESION_URL } from "@/lib/adhesion";
import { formatEuros } from "@/lib/constants";
import { getAssociation, getSiteSettings } from "@/lib/settings";

import { AssoConnectForm } from "./assoconnect-form";
import { HeroVideo, Motion, ScrollProgress } from "./motion";
import { Terrain } from "./terrain";
import "./vitrine.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rejoindre Banat Sport Club — Montpellier",
  description:
    "Club multisport féminin à Montpellier : football, rugby, volley, self-défense, danse. Un rendez-vous par semaine, débutante ou confirmée.",
  openGraph: {
    title: "Rejoindre Banat Sport Club",
    description:
      "Club multisport féminin à Montpellier. On y joue pour de vrai — simplement, personne ne compte les points. Inscriptions ouvertes.",
    type: "website",
  },
};

const MARQUEE_ONE = [
  "Football",
  "Rugby",
  "Volley",
  "Self-défense",
  "Renforcement",
  "Gym",
  "Danse",
  "Jeux collectifs",
];

const MARQUEE_TWO = [
  "Débutante ou confirmée",
  "On joue pour de vrai",
  "Personne ne compte les points",
  "Entre filles",
  "Encadrées",
  "Le téléphone au vestiaire",
  "On s’encourage",
  "On s’entraide",
];

/**
 * Ce que chaque lieu a de concret à offrir.
 *
 * Une surface, une taille : c'est ce qui rend un gymnase désirable pour une
 * fille qui fait déjà du sport, là où « salle de sport » ne dit rien.
 */
const VENUE_NOTES: Record<string, string> = {
  jeudi:
    "Plus de 200 m² de tatamis : de la place pour se déplacer, tomber sans se faire mal et profiter vraiment de la séance.",
  dimanche:
    "Un vrai stade, en plein air : terrain complet pour le football, le rugby et les grands jeux collectifs.",
};

const PROMISES = [
  {
    number: "01",
    title: "Jouer pour de vrai",
    text: "Des séances où on court, où on se donne, où on ressort essoufflée et contente de l’être. Le jeu est réel, l’intensité aussi.",
  },
  {
    number: "02",
    title: "Se dépasser",
    text: "Se mesurer aux autres, à soi, à la semaine dernière. Sans classement, sans sélection, sans personne pour juger.",
  },
  {
    number: "03",
    title: "Créer du lien",
    text: "Un vrai groupe, construit sur l’entraide et le respect. On arrive parfois seule, on ne repart jamais seule.",
  },
  {
    number: "04",
    title: "Se déconnecter",
    text: "Le téléphone reste au vestiaire. Une heure et demie pour être pleinement là, avec les autres.",
  },
];

const INCLUDED = [
  { text: "L’accès à toutes les séances de la saison" },
  { text: "L’encadrement" },
  { text: "L’assurance du club" },
  { text: "L’affiliation" },
  {
    text: "Le kit BSC — sac, gourde, accessoires",
    highlight: "Offert cette première saison",
  },
];

const SPIRIT = [
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
 * Vidéo de fond du hero.
 *
 * Aucune vidéo n'existe aujourd'hui : `public/videos/` est vide, et le fond
 * animé en CSS tient la page tout seul. On vérifie donc la présence du fichier
 * au moment du rendu plutôt que de poser une balise `<video>` en aveugle — qui
 * déclencherait deux 404 à chaque visite pour rien.
 *
 * Le dossier est déclaré dans `outputFileTracingIncludes` (next.config.ts),
 * sans quoi ce test répondrait toujours « non » en production : les fichiers de
 * `public/` sont servis par le CDN mais ne sont pas embarqués dans la fonction.
 * Même patron que le PDF du règlement.
 */
function heroVideoSources(): string[] {
  const candidates = ["hero.webm", "hero.mp4"];
  return candidates
    .filter((name) => existsSync(path.join(process.cwd(), "public", "videos", name)))
    .map((name) => `/videos/${name}`);
}

export default async function RejoindrePage() {
  const [{ season, annualFeeCents, groups }, association] = await Promise.all([
    getSiteSettings(),
    getAssociation(),
  ]);

  const videoSources = heroVideoSources();

  return (
    <>
      <ScrollProgress />

      {/*
        En-tête volontairement réduit à une marque et un bouton. Une vitrine a un
        seul objectif : les liens de navigation du site complet ne feraient que
        proposer des sorties.
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
            Rejoindre
          </a>
        </div>
      </header>

      <Motion>
        <main>
          {/* 1 — Hero ------------------------------------------------------ */}
          <section className="bsc-grain relative isolate flex min-h-[88svh] items-center overflow-hidden bg-brand-dark">
            {/* Fond : halos qui respirent, puis balayage lumineux. */}
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
                {/* Voile : le texte doit rester lisible sur n'importe quelle image. */}
                <div className="absolute inset-0 bg-brand-dark/65" />
              </div>
            )}

            {/*
              Sur grand écran, la colonne de texte laisse la moitié droite vide.
              On y pose les deux terrains, décalés comme deux tirages posés l'un
              sur l'autre : ça remplit le cadre, ça annonce les créneaux, et le
              ballon qui y circule met le hero en mouvement. Masqué sous `lg` —
              sur téléphone, le texte doit avoir toute la place.
            */}
            <div
              aria-hidden
              className="pointer-events-none absolute right-8 top-1/2 hidden w-[38%] max-w-md -translate-y-1/2 xl:right-16 lg:block"
            >
              {groups.slice(0, 2).map((group, index) => (
                <div
                  key={group.key}
                  className="overflow-hidden rounded-3xl border border-white/15 shadow-2xl shadow-black/40"
                  style={{
                    // Décalage vers le bas ET vers la droite : le libellé de la
                    // première carte, en bas à gauche, reste entièrement lisible.
                    transform: `rotate(${index === 0 ? -3 : 2.5}deg)`,
                    marginTop: index === 0 ? 0 : "-1.5rem",
                    marginLeft: index === 0 ? 0 : "2rem",
                  }}
                >
                  <div className="relative h-44 xl:h-48">
                    <Terrain variant={group.key === "jeudi" ? "dojo" : "stade"} />
                    {/*
                      Libellés en HAUT : les cartes se recouvrent par le bas, et
                      le nom du premier créneau resterait caché s'il y était.
                    */}
                    <div className="absolute inset-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent p-4">
                      <span>
                        <span className="block text-lg font-extrabold uppercase tracking-tight text-white">
                          {group.day}
                        </span>
                        {/*
                          La classe visée, dès le hero : c'est elle qui fait
                          comprendre d'un coup d'œil que les deux cartes
                          s'adressent à deux âges, et pas à la même fille.
                        */}
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

                <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Remettre les filles
                  <span className="block text-brand-light">en jeu.</span>
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
                  Un club multisport pour les filles, à Montpellier. Chaque
                  semaine, un terrain, un ballon, un groupe — et un sport qui
                  change au fil de la saison : football, rugby, volley,
                  self-défense, danse. On y joue pour de vrai. Simplement,
                  personne ne compte les points.
                </p>

                <div
                  data-reveal
                  style={{ ["--bsc-delay" as string]: "120ms" }}
                  className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <a
                    href="#adherer"
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand px-8 text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:bg-white hover:text-brand-dark"
                  >
                    Rejoindre le club
                  </a>
                  <a
                    href="#creneaux"
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/30 px-7 text-base font-semibold text-white transition hover:bg-white/10"
                  >
                    Voir mon créneau
                  </a>
                </div>

                {/*
                  Le bouton ne porte plus le prix — il invite, il ne facture
                  pas. Mais une famille a le droit de connaître le montant sans
                  avoir à faire défiler : il est juste en dessous, avec la
                  bonne nouvelle du kit offert.
                */}
                <p
                  data-reveal
                  style={{ ["--bsc-delay" as string]: "180ms" }}
                  className="mt-4 text-sm text-white/65"
                >
                  {formatEuros(annualFeeCents)} pour l’année — kit BSC offert
                  cette première saison.
                </p>

                <dl
                  data-reveal
                  style={{ ["--bsc-delay" as string]: "220ms" }}
                  className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 border-t border-white/15 pt-7 sm:grid-cols-3"
                >
                  {[
                    // « 2 séances » laissait croire qu'une adhérente vient deux
                    // fois. Elle vient une fois, à SON créneau — dit ici comme
                    // un rendez-vous à elle, pas comme une restriction.
                    { k: "Ton rendez-vous", v: "Une fois par semaine" },
                    { k: "Niveau", v: "Débutante ou confirmée" },
                    { k: "Esprit", v: "On joue pour de vrai" },
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
              aria-label="Descendre"
              className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 hover:text-white"
            >
              <span aria-hidden className="bsc-nudge block text-2xl leading-none">
                ↓
              </span>
            </a>
          </section>

          {/* 2 — Bandeaux défilants --------------------------------------- */}
          <section
            aria-label="Ce qu’on pratique et l’esprit du club"
            className="overflow-hidden border-y border-brand-light/40 bg-white py-5"
          >
            <Marquee items={MARQUEE_ONE} />
            <Marquee items={MARQUEE_TWO} reverse muted />
          </section>

          {/*
            Le message qui décide de l'inscription pour beaucoup de familles :
            une fille déjà en club ne doit pas croire que ce sera trop mou pour
            elle, et une débutante ne doit pas croire que ce sera trop dur.
            Il est placé haut, juste après le hero, parce que les deux se font
            un avis en quelques secondes.
          */}
          <section className="border-b border-brand-light/40 bg-white py-14 sm:py-16">
            <div className="mx-auto max-w-4xl px-5 text-center">
              <p
                data-reveal
                className="text-2xl font-bold leading-snug tracking-tight text-brand-dark sm:text-4xl"
              >
                Il y a celles qui jouent en club depuis des années, et celles
                qui n’ont jamais mis les pieds sur un terrain.{" "}
                <span className="text-brand">
                  Elles jouent dans la même équipe.
                </span>
              </p>
              <p
                data-reveal
                style={{ ["--bsc-delay" as string]: "120ms" }}
                className="mx-auto mt-5 max-w-2xl text-lg text-brand-dark/75"
              >
                Ce n’est pas le niveau qui fait entrer au club. C’est l’envie.
              </p>
            </div>
          </section>

          {/* 3 — Créneaux -------------------------------------------------- */}
          <section id="creneaux" className="scroll-mt-16 py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-5">
              <div data-reveal className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                  Ton créneau
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-dark sm:text-5xl">
                  Ton rendez-vous de la semaine
                </h2>
                {/*
                  Le malentendu à dissiper : « deux créneaux » se lisait comme
                  « je viens deux fois par semaine ». La correction se glisse
                  dans la phrase — « le tien », « ton groupe » — plutôt que de
                  s'imposer en gras. On informe, on ne rectifie pas.
                */}
                <p className="mt-4 text-lg text-brand-dark/75">
                  Deux créneaux ouvrent cette saison, un par tranche d’âge. Le
                  tien se devine à ta classe : une séance par semaine, toujours
                  avec le même groupe.
                </p>
                <p className="mt-3 text-brand-dark/70">
                  Et si tu es en 3e, tu as le luxe de pouvoir choisir : le jeudi
                  ou le dimanche, comme tu préfères. On en discute ensemble.
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
                      {VENUE_NOTES[group.key] && (
                        <p className="mt-4 border-t border-brand-light/40 pt-4 text-brand-dark/75">
                          {VENUE_NOTES[group.key]}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* 4 — Ce qu'on vient chercher ---------------------------------- */}
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
                Ce qu’on vient y chercher
              </h2>

              <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2">
                {PROMISES.map((promise, index) => (
                  <div
                    key={promise.title}
                    data-reveal
                    style={{ ["--bsc-delay" as string]: `${index * 90}ms` }}
                    className="bg-brand-dark p-7 transition hover:bg-[#6d1430] sm:p-9"
                  >
                    <span className="text-sm font-bold text-brand-light">
                      {promise.number}
                    </span>
                    <h3 className="mt-2 text-2xl font-bold uppercase tracking-tight">
                      {promise.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-white/75">{promise.text}</p>
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

          {/* 5 — L'esprit -------------------------------------------------- */}
          <section className="py-20 sm:py-24">
            <div className="mx-auto max-w-5xl px-5">
              <h2
                data-reveal
                className="text-3xl font-extrabold tracking-tight text-brand-dark sm:text-5xl"
              >
                Les règles du jeu
              </h2>
              <p data-reveal className="mt-4 max-w-2xl text-lg text-brand-dark/75">
                Huit phrases. C’est tout ce qu’on se demande les unes aux
                autres.
              </p>
              <ul className="mt-9 flex flex-wrap gap-2.5">
                {SPIRIT.map((rule, index) => (
                  <li
                    key={rule}
                    data-reveal
                    style={{ ["--bsc-delay" as string]: `${index * 45}ms` }}
                    className="rounded-full border border-brand-light/60 bg-white px-5 py-2.5 font-medium text-brand-dark transition hover:border-brand hover:bg-brand-light/15"
                  >
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 6 — Adhésion -------------------------------------------------- */}
          <section id="adherer" className="scroll-mt-16 bg-white py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-5">
              <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
                {/*
                  Le formulaire AssoConnect fait plusieurs milliers de pixels de
                  haut. Sans `sticky`, le prix et le QR code défilent hors de
                  vue dès la première question et la colonne paraît abandonnée.
                */}
                <div data-reveal className="lg:sticky lg:top-20 lg:self-start">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                    Inscriptions ouvertes — {season}
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-dark sm:text-5xl">
                    On vous attend
                  </h2>

                  <p className="mt-7 flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold tracking-tight text-brand-dark sm:text-6xl">
                      {formatEuros(annualFeeCents)}
                    </span>
                    <span className="text-lg font-semibold text-brand-dark/60">
                      pour l’année
                    </span>
                  </p>

                  <ul className="mt-7 space-y-3">
                    {INCLUDED.map((item) => (
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
                    Première saison : le nombre de places est limité.
                  </p>

                  <div className="mt-9 rounded-2xl border border-brand-light/50 bg-cream p-5">
                    <div className="flex items-start gap-4">
                      <Image
                        src={ADHESION_QR_PATH}
                        alt="QR code vers le formulaire d’adhésion"
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
                    Une question avant de vous lancer ?{" "}
                    <a
                      href={`mailto:${association.email}`}
                      className="font-semibold text-brand underline"
                    >
                      {association.email}
                    </a>
                    {association.phone && (
                      <>
                        {" · "}
                        <a
                          href={`tel:${association.phone.replace(/\s/g, "")}`}
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

          {/* 7 — Dernier appel -------------------------------------------- */}
          <section className="bsc-grain relative overflow-hidden bg-brand py-16 text-center text-white">
            <div
              aria-hidden
              className="bsc-halo absolute inset-x-0 top-0 mx-auto h-[40vh] w-[40vh] rounded-full bg-white/20 blur-[90px]"
            />
            <div className="relative mx-auto max-w-2xl px-5">
              <h2 data-reveal className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Venez essayer. On vous attend sur le terrain.
              </h2>
              <a
                data-reveal
                href={ADHESION_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex min-h-14 items-center justify-center rounded-2xl bg-white px-8 text-base font-bold text-brand-dark transition hover:-translate-y-0.5 hover:bg-brand-dark hover:text-white"
              >
                Rejoindre le club
              </a>
            </div>
          </section>
        </main>
      </Motion>

      <SiteFooter />
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
      <div
        className={`bsc-marquee-track ${reverse ? "bsc-marquee-track--reverse" : ""}`}
      >
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
