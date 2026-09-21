import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatEuros } from "@/lib/constants";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const PILLARS = [
  {
    title: "Bouger",
    text: "Retrouver le plaisir d’être active et découvrir différentes pratiques sportives.",
  },
  {
    title: "Prendre confiance",
    text: "Progresser à son rythme, découvrir ses capacités et être valorisée dans ses efforts.",
  },
  {
    title: "Créer du lien",
    text: "Construire un vrai esprit de groupe fondé sur l’entraide, le respect et la solidarité.",
  },
  {
    title: "Se déconnecter",
    text: "Poser le téléphone, sortir des écrans et se reconnecter au mouvement, aux autres et à soi.",
  },
];

const ACTIVITIES = [
  "Football",
  "Volleyball",
  "Rugby flag / découverte",
  "Préparation physique ludique",
  "Jeux collectifs",
  "Relais",
  "Activités en plein air",
];

const SESSION_FLOW = [
  "Accueil",
  "Échauffement",
  "Activité sportive",
  "Jeux ou matchs",
  "Retour au calme",
  "Temps d’échange",
];

const AUDIENCE = [
  {
    title: "Tous niveaux",
    text: "Aucun niveau sportif particulier n’est demandé.",
  },
  {
    title: "Sport loisir",
    text: "Pas de compétition ni de pression de résultat.",
  },
  {
    title: "Esprit de groupe",
    text: "Respect, encouragement et zéro jugement.",
  },
];

const SPIRIT = [
  "On respecte les autres.",
  "On s’encourage.",
  "On ne se moque pas.",
  "On ne juge pas.",
  "On arrive à l’heure.",
  "On s’entraide.",
  "On écoute les consignes.",
  "On pose son téléphone.",
  "On profite du moment.",
];

const FEE_INCLUDES = [
  "L’accès aux séances de l’année",
  "L’assurance",
  "Le kit BSC : sac, gourde, accessoires",
  "L’affiliation",
];

export default async function HomePage() {
  const { season, annualFeeCents, groups } = await getSiteSettings();

  return (
    <>
      <SiteHeader />

      <main>
        {/* 1 — Hero */}
        <section className="mx-auto max-w-5xl px-5 pb-14 pt-12 sm:pb-20 sm:pt-20">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Banat Sport Club
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] tracking-tight text-brand-dark sm:text-6xl">
            Remettre les filles
            <br />
            en jeu.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-brand-dark/80 sm:text-xl">
            Du sport, du collectif et du plaisir pour remettre les filles en
            mouvement.
          </p>
          <p className="mt-3 max-w-xl text-brand-dark/70">
            Un club multisport loisir à Montpellier, de la 6e à la Terminale.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/inscription" className="btn">
              S’inscrire au club
            </Link>
            <Link href="#le-club" className="btn-ghost justify-center py-3">
              Découvrir BSC
            </Link>
          </div>

          <p className="mt-6 text-sm text-brand-dark/60">Saison {season}</p>
        </section>

        {/* 2 — Pourquoi BSC */}
        <section id="le-club" className="scroll-mt-20 bg-white py-16">
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
              Bouger. Respirer. Se retrouver.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-brand-dark/80">
              Aujourd’hui, beaucoup de jeunes filles décrochent progressivement
              du sport. Banat Sport Club a été créé pour leur redonner un espace
              où reprendre goût au mouvement, sans pression et sans jugement.
            </p>
            <blockquote className="mt-8 border-l-4 border-brand pl-5 text-xl font-medium leading-relaxed text-brand-dark sm:text-2xl">
              « Ici, on ne vient pas chercher la performance. On vient bouger,
              rire, progresser et passer de bons moments ensemble. »
            </blockquote>
          </div>
        </section>

        {/* 3 — Notre mission */}
        <section id="mission" className="scroll-mt-20 py-16">
          <div className="mx-auto max-w-5xl px-5">
            <h2 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
              Notre mission
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-brand-dark/80">
              « Remettre en mouvement des jeunes filles qui ont décroché, par le
              sport plaisir, le collectif et la reconnexion à soi. »
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {PILLARS.map((pillar, index) => (
                <div key={pillar.title} className="card">
                  <span className="text-sm font-semibold text-brand-light">
                    0{index + 1}
                  </span>
                  <h3 className="mt-1 text-xl font-bold uppercase tracking-tight text-brand-dark">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-brand-dark/75">{pillar.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 — Déconnexion / Reconnexion */}
        <section className="bg-brand-dark py-16 text-white">
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Déconnexion — Reconnexion
            </h2>
            <p className="mt-6 text-xl leading-relaxed text-brand-light">
              « Se déconnecter des écrans pour se reconnecter à soi, aux autres
              et au mouvement. »
            </p>
            <p className="mt-6 leading-relaxed text-white/85">
              Pendant les séances, les téléphones restent au vestiaire afin que
              les filles profitent réellement du moment : sport, jeux, échanges
              et collectif.
            </p>
          </div>
        </section>

        {/* 5 — Comment ça se passe */}
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-5">
            <h2 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
              Comment ça se passe ?
            </h2>
            <p className="mt-5 max-w-2xl text-brand-dark/80">
              Banat Sport Club est un club multisport loisir. Les activités
              varient au fil des séances et des projets.
            </p>

            <ul className="mt-8 flex flex-wrap gap-2">
              {ACTIVITIES.map((activity) => (
                <li
                  key={activity}
                  className="rounded-full bg-brand-light/25 px-4 py-2 text-sm font-medium text-brand-dark"
                >
                  {activity}
                </li>
              ))}
            </ul>

            <div className="card mt-10">
              <h3 className="text-lg font-semibold text-brand-dark">
                Une séance type
              </h3>
              <ol className="mt-4 space-y-2">
                {SESSION_FLOW.map((step, index) => (
                  <li key={step} className="flex gap-3 text-brand-dark/80">
                    <span className="font-semibold text-brand">{index + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 6 — Créneaux */}
        <section id="creneaux" className="scroll-mt-20 bg-white py-16">
          <div className="mx-auto max-w-5xl px-5">
            <h2 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
              Choisis ton créneau
            </h2>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {groups.map((group) => (
                <div
                  key={group.key}
                  className="flex flex-col rounded-2xl border-2 border-brand-light/50 p-6"
                >
                  <p className="text-2xl font-extrabold uppercase tracking-tight text-brand-dark">
                    {group.day}
                  </p>
                  <p className="mt-1 font-semibold text-brand-dark/80">
                    {group.levels}
                  </p>
                  <p className="mt-3 text-xl font-semibold text-brand">
                    {group.time}
                  </p>
                  <p className="mt-2 text-brand-dark/70">{group.place}</p>
                  <a
                    href={group.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 text-sm text-brand underline"
                  >
                    {group.address}
                  </a>
                  <Link
                    href={`/inscription?creneau=${group.key}`}
                    className="btn mt-6 w-full"
                  >
                    Choisir ce créneau
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7 — Pour qui */}
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-5">
            <h2 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
              Pour qui ?
            </h2>
            <p className="mt-5 text-lg text-brand-dark/80">
              Pour les filles de la 6e à la Terminale.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {AUDIENCE.map((item) => (
                <div key={item.title} className="card">
                  <h3 className="text-lg font-semibold text-brand-dark">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-brand-dark/75">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8 — L'esprit BSC */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
              L’esprit BSC
            </h2>
            <ul className="mt-8 space-y-3">
              {SPIRIT.map((rule) => (
                <li key={rule} className="flex gap-3 text-lg text-brand-dark/85">
                  <span aria-hidden className="text-brand">
                    ✦
                  </span>
                  {rule}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-2xl font-bold text-brand">
              « On progresse ensemble. »
            </p>
          </div>
        </section>

        {/* 9 — Cotisation */}
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-5">
            <div className="rounded-2xl border-2 border-brand-light/50 bg-white p-7 sm:p-10">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                Cotisation annuelle
              </h2>
              <p className="mt-4 text-5xl font-extrabold tracking-tight text-brand-dark sm:text-6xl">
                {formatEuros(annualFeeCents)}
              </p>
              <p className="mt-2 text-brand-dark/70">par an, par adhérente</p>

              <div className="mt-8 border-t border-brand-light/40 pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-dark">
                  Ce que ça inclut
                </h3>
                <ul className="mt-4 space-y-3">
                  {FEE_INCLUDES.map((item) => (
                    <li key={item} className="flex gap-3 text-brand-dark/85">
                      <span aria-hidden className="font-bold text-brand">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/inscription" className="btn mt-8 w-full sm:w-auto">
                S’inscrire maintenant
              </Link>
            </div>
          </div>
        </section>

        {/* 10 — CTA final */}
        <section className="pb-4">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
              Envie de rejoindre Banat Sport Club ?
            </h2>
            <p className="mt-4 text-lg text-brand-dark/80">
              L’inscription prend seulement quelques minutes.
            </p>
            <Link href="/inscription" className="btn mt-8 w-full sm:w-auto">
              Commencer l’inscription
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
