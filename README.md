# Banat Sport Club

Mini-site public, formulaire d'inscription et mini-CRM pour **Banat Sport Club**,
association sportive féminine à Montpellier.

- **Public** : collégiennes et lycéennes, de la 6e à la Terminale
- **Groupe jeudi** : jeudi 18h00 – 19h30, Dojo Montpellier
- **Groupe dimanche** : dimanche 10h30 – 12h30, Stade de Grabels

## Stack

| Élément | Choix |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Styles | Tailwind CSS 4 (pas de librairie de composants) |
| Base de données | Neon PostgreSQL |
| ORM | Drizzle ORM + drizzle-kit |
| Validation | Zod |
| Hébergement | Vercel |

Pas de Supabase, pas de Redux, pas de Docker, pas de framework UI.
Tout tient dans une poignée de fichiers, lisibles par une seule personne.

## Démarrage en local

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer la base Neon

1. Créer un compte sur [neon.tech](https://neon.tech) et un projet (région Europe).
2. Copier la **chaîne de connexion "pooled"** (`...-pooler...`).

### 3. Configurer l'environnement

```bash
cp .env.example .env.local
```

Puis remplir `.env.local` (voir le tableau plus bas). Pour générer la clé de session :

```bash
openssl rand -base64 32
```

### 4. Créer les tables

```bash
npm run db:migrate
```

### 5. Insérer les valeurs initiales

```bash
npm run db:seed
```

Ce script écrit dans la table `settings` :

| Clé | Valeur |
| --- | --- |
| `season` | `2026-2027` |
| `annual_fee_cents` | `15000` (150 €) |
| `group_jeudi` | `Jeudi 18h00 – 19h30 — Dojo Montpellier` |
| `group_dimanche` | `Dimanche 10h30 – 12h30 — Stade de Grabels` |

### 6. Lancer le serveur

```bash
npm run dev
```

Le site est sur <http://localhost:3000>, l'espace bureau sur
<http://localhost:3000/admin>.

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Chaîne de connexion Neon (pooled), obligatoire |
| `ADMIN_EMAIL` | Email de l'identifiant commun du bureau |
| `ADMIN_PASSWORD` | Mot de passe de l'identifiant commun du bureau |
| `SESSION_SECRET` | Clé de signature du cookie de session, 32 caractères minimum |

En local ces variables vivent dans `.env.local` (jamais commité).
Sur Vercel, les ajouter dans *Settings → Environment Variables*.

## Scripts npm

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run db:generate` | Génère une migration SQL à partir de `lib/db/schema.ts` |
| `npm run db:migrate` | Applique les migrations sur la base Neon |
| `npm run db:seed` | (Ré)écrit les réglages initiaux |
| `npm run db:studio` | Ouvre Drizzle Studio pour inspecter la base |

## Pages

### Public

| Route | Contenu |
| --- | --- |
| `/` | Présentation de l'association et des deux groupes |
| `/informations` | Horaires, lieux, cotisation, documents à fournir |
| `/inscription` | Formulaire d'inscription complet |

### Bureau (authentifié)

| Route | Contenu |
| --- | --- |
| `/admin/login` | Connexion (identifiant commun) |
| `/admin` | Tableau de bord : effectifs, statuts, montant encaissé |
| `/admin/adherentes` | Liste des adhérentes de la saison |
| `/admin/paiements` | Historique des paiements + saisie manuelle |
| `/admin/presences` | Feuille de présence par groupe et par date |

### API

| Route | Méthode | Accès |
| --- | --- | --- |
| `/api/registration` | `POST` | Public — crée une inscription |
| `/api/payments` | `GET`, `POST` | Bureau — liste et enregistre les paiements |
| `/api/attendance` | `GET`, `POST` | Bureau — lit et enregistre les présences |

## Authentification

Volontairement minimaliste : **un seul identifiant partagé** par la présidente,
la trésorière et la secrétaire, défini par `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
Pas de table `users`, pas de rôles, pas de librairie d'auth.

La session est un cookie `httpOnly` signé en HMAC-SHA256 avec `SESSION_SECRET`,
valable 12 heures (`lib/auth.ts`, une centaine de lignes).

Pour changer le mot de passe : modifier la variable d'environnement et
redéployer. Toutes les sessions ouvertes restent valides jusqu'à expiration ;
changer aussi `SESSION_SECRET` pour les invalider immédiatement.

## Base de données

Dix tables, décrites dans `lib/db/schema.ts` :

`members`, `guardians`, `emergency_contacts`, `medical_info`, `payments`,
`sessions` (séances d'entraînement), `attendance`, `notes`, `documents`,
`settings`.

Deux conventions à connaître :

- **Les montants sont en centimes** (`payments.amount_cents`, `settings.annual_fee_cents`),
  pour éviter tout arrondi. `formatEuros()` dans `lib/constants.ts` les affiche.
- **Les statuts sont de simples colonnes `text`**, validées par Zod côté
  application (`lib/validation.ts`). Faire évoluer une liste de valeurs ne
  demande donc pas de migration.

Pour modifier le schéma : éditer `lib/db/schema.ts`, puis

```bash
npm run db:generate   # écrit un nouveau fichier dans drizzle/
npm run db:migrate    # l'applique
```

## Déploiement sur Vercel

1. Importer le dépôt sur [vercel.com](https://vercel.com).
2. Ajouter les quatre variables d'environnement.
3. Déployer — Vercel détecte Next.js automatiquement.
4. Appliquer les migrations depuis son poste (`npm run db:migrate`) en pointant
   `DATABASE_URL` sur la base de production.

## Structure

```
app/
  page.tsx                  Accueil
  inscription/              Formulaire public
  informations/             Informations pratiques
  admin/
    login/                  Connexion + server actions
    (protected)/            Pages protégées (layout qui exige la session)
      page.tsx              Tableau de bord
      adherentes/
      paiements/
      presences/
  api/
    registration/route.ts
    payments/route.ts
    attendance/route.ts
components/site-chrome.tsx  En-tête et pied de page publics
lib/
  auth.ts                   Session admin (cookie signé)
  constants.ts              Groupes, classes, statuts, formatage
  validation.ts             Schémas Zod
  settings.ts               Lecture de la table settings
  registration.ts           Création d'une inscription
  db/index.ts               Client Drizzle + Neon
  db/schema.ts              Schéma des tables
drizzle/                    Migrations SQL générées
scripts/seed.ts             Réglages initiaux
```

## À faire ensuite

Non implémenté pour l'instant, volontairement :

- **Mollie** — paiement par carte. Les colonnes `payments.provider` et
  `payments.provider_payment_id` sont déjà prévues.
- **Resend** — email de confirmation d'inscription et relances de paiement.
- **Cloudflare R2** — certificats médicaux, autorisations parentales et
  signatures. La table `documents` (`file_key`) est déjà prévue.
- **Qonto** — rapprochement des virements avec les paiements.
- Changement de statut d'une inscription depuis l'admin (confirmer / annuler).
- Export CSV de la liste des adhérentes.
