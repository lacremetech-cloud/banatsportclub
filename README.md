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
| `annual_fee_cents` | `20000` (200 €) |
| `group_jeudi_day` / `_time` / `_place` | `Jeudi` / `18h00 – 19h30` / `Dojo Montpellier` |
| `group_dimanche_day` / `_time` / `_place` | `Dimanche` / `10h30 – 12h30` / `Stade de Grabels` |

Le tarif et les créneaux affichés sur le site viennent **toujours** de cette
table, jamais d'une constante recopiée dans un composant (voir
`getSiteSettings()` dans `lib/settings.ts`).

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
| `/` | Landing page : mission, créneaux, esprit BSC, cotisation |
| `/informations` | Horaires, lieux, cotisation, tenue, règles essentielles |
| `/reglement` | Règlement intérieur |
| `/inscription` | Parcours d'inscription en 8 étapes |

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

Onze tables, décrites dans `lib/db/schema.ts` :

`members`, `guardians`, `emergency_contacts`, `medical_info`, `consents`,
`payments`, `sessions` (séances d'entraînement), `attendance`, `notes`,
`documents`, `settings`.

Une inscription crée en une transaction : 1 `members`, 1 `guardians`,
1 `emergency_contacts`, 1 `medical_info` et exactement 3 `consents`
(`INTERNAL_RULES`, `PARENTAL_AUTHORIZATION`, `IMAGE_RIGHTS` — la ligne existe
même en cas de refus, avec `accepted = false`). L'adhérente démarre en
`registration_status = PENDING_PAYMENT`.

Quatre conventions à connaître :

- **Les montants sont en centimes** (`payments.amount_cents`, `settings.annual_fee_cents`),
  pour éviter tout arrondi. `formatEuros()` dans `lib/constants.ts` les affiche.
- **Les statuts sont de simples colonnes `text`**, validées par Zod côté
  application (`lib/validation.ts`). Faire évoluer une liste de valeurs ne
  demande donc pas de migration.
- **`members.member_number`** (`BSC-26-0001`) est alimenté par la séquence
  Postgres `member_number_seq`. `nextval()` est atomique : deux inscriptions
  simultanées obtiennent deux numéros différents.
- **`members.preferred_payment_method`** (`CARD`, `BANK_TRANSFER`, `CHEQUE`,
  `CASH`) est le mode de règlement *souhaité*, choisi à l'inscription. Il ne
  crée aucune ligne dans `payments` : cette table ne contient que des
  encaissements réellement constatés par le bureau.

Pour modifier le schéma : éditer `lib/db/schema.ts`, puis

```bash
npm run db:generate   # écrit un nouveau fichier dans drizzle/
npm run db:migrate    # l'applique
```

## Déploiement sur Vercel

Le dépôt est connecté au projet Vercel `banatsportclub`. L'intégration GitHub
déploie toute seule :

| Évènement | Résultat |
| --- | --- |
| push sur une branche | Preview Deployment |
| pull request | URL de Preview commentée sur la PR |
| push sur la branche de production | Production Deployment |

### Variables d'environnement

Les quatre variables (`DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`SESSION_SECRET`) doivent être cochées pour **Production ET Preview** dans
*Settings → Environment Variables*. Une variable absente d'un environnement y
donne un 500 sur toutes les pages qui lisent la base.

Vercel fige les variables au moment du build : après en avoir ajouté ou modifié
une, il faut **relancer un déploiement** pour qu'elle soit prise en compte.
Un simple enregistrement dans l'interface ne suffit pas.

Preview et Production partagent aujourd'hui la même base Neon. C'est un choix
de phase de développement, à revoir dès qu'il y aura de vraies adhérentes :
une Preview peut écrire dans la base.

### Migrations

Elles ne sont pas jouées par le build. Les appliquer depuis son poste en
pointant `DATABASE_URL` sur la base visée :

```bash
npm run db:migrate
```

## Structure

```
app/
  page.tsx                  Landing page publique
  inscription/              Parcours d'inscription en 8 étapes
  informations/             Informations pratiques
  reglement/                Règlement intérieur
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
components/site-header.tsx  En-tête public (menu mobile)
components/site-footer.tsx  Pied de page public
lib/
  auth.ts                   Session admin (cookie signé)
  constants.ts              Classes, statuts, libellés, formatage
  validation.ts             Schémas Zod (dont un par étape du formulaire)
  settings.ts               Lecture de la table settings (tarif, créneaux)
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
