# Banat Sport Club

Mini-site public, formulaire d'inscription et mini-CRM pour **Banat Sport Club**,
association sportive féminine à Montpellier.

- **Public** : collégiennes et lycéennes, de la 6e à la Terminale
- **Jeudi soir — 6e à 3e** : 18h00 – 19h30, Complexe sportif des Garrigues — Haut de Massane, 297 Av. du Comté de Nice, 34080 Montpellier
- **Dimanche matin — 3e à Terminale** : 10h30 – 12h30, Stade Serge Oltra — Grabels, Rue du Mas d'Armand, 34790 Grabels

La 3e est volontairement éligible aux deux créneaux. Les niveaux guident le
parent, ils ne bloquent aucune inscription : le bureau peut accepter une
situation particulière.

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
| `group_jeudi_day` / `_levels` / `_time` / `_place` / `_address` | `Jeudi soir` / `6e à 3e` / `18h00 – 19h30` / `Complexe sportif des Garrigues — Haut de Massane` / `297 Av. du Comté de Nice, 34080 Montpellier` |
| `group_dimanche_day` / `_levels` / `_time` / `_place` / `_address` | `Dimanche matin` / `3e à Terminale` / `10h30 – 12h30` / `Stade Serge Oltra — Grabels` / `Rue du Mas d'Armand, 34790 Grabels` |

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
| `MOLLIE_API_KEY` | Clé API Mollie, **clé TEST tant qu'on n'est pas en production réelle** |
| `RESEND_API_KEY` | Clé API Resend pour les emails transactionnels |
| `RESEND_FROM_EMAIL` | Expéditeur des emails, sur un domaine vérifié dans Resend |
| `APP_URL` | URL publique du site, pour l'URL de retour Mollie et celle du webhook |

Seules les quatre premières sont obligatoires. Les quatre suivantes sont
**optionnelles et dégradantes** : sans `MOLLIE_API_KEY`, le paiement par carte
disparaît de l'écran de confirmation et le virement, le chèque et les espèces
restent proposés ; sans `RESEND_API_KEY`, aucun email n'est envoyé mais
l'inscription aboutit quand même. Une inscription n'est jamais bloquée par
l'absence de configuration de paiement ou d'email.

`MOLLIE_API_KEY`, `RESEND_API_KEY`, `SESSION_SECRET` et `DATABASE_URL` sont
strictement serveur. Elles ne sont jamais lues depuis un composant client,
jamais placées dans une variable `NEXT_PUBLIC_*`, et jamais écrites dans les
logs : le code ne journalise que des identifiants Mollie et des motifs d'échec.

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
| `/inscription/paiement` | Retour après paiement Mollie : état réel de la cotisation |

### Bureau (authentifié)

| Route | Contenu |
| --- | --- |
| `/admin/login` | Connexion (identifiant commun) |
| `/admin` | Tableau de bord : effectifs, statuts, montant encaissé |
| `/admin/adherentes` | Liste des adhérentes de la saison |
| `/admin/paiements` | Historique des paiements + saisie manuelle |
| `/admin/presences` | Feuille de présence par groupe et par date |
| `/admin/comptabilite` | Recettes, dépenses, solde et mouvements de la saison |

### API

| Route | Méthode | Accès |
| --- | --- | --- |
| `/api/registration` | `POST` | Public — crée une inscription |
| `/api/payments` | `GET`, `POST` | Bureau — liste et enregistre les paiements |
| `/api/attendance` | `GET`, `POST` | Bureau — lit et enregistre les présences |
| `/api/payments/mollie` | `POST` | Public — ouvre un paiement carte pour une adhérente |
| `/api/webhooks/mollie` | `POST` | Mollie — notification de changement de statut |

## Authentification

Volontairement minimaliste : **un seul identifiant partagé** par la présidente,
la trésorière et la secrétaire, défini par `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
Pas de table `users`, pas de rôles, pas de librairie d'auth.

La session est un cookie `httpOnly` signé en HMAC-SHA256 avec `SESSION_SECRET`,
valable 12 heures (`lib/auth.ts`, une centaine de lignes).

Pour changer le mot de passe : modifier la variable d'environnement et
redéployer. Toutes les sessions ouvertes restent valides jusqu'à expiration ;
changer aussi `SESSION_SECRET` pour les invalider immédiatement.

## Cotisations, échéanciers et SMS

### Trois cotisations, un montant figé

Le bureau dispose de trois types de cotisation, tous **administratifs** : ils ne
sont jamais proposés sur le formulaire public.

| Type | Montant | Réglage |
| --- | --- | --- |
| `STANDARD` | 200 € | `settings.annual_fee_cents` |
| `SOLIDARITY` | 100 € | `settings.solidarity_fee_cents` |
| `FREE` | 0 € | — |

Le montant dû est **figé sur l'adhérente** (`members.fee_amount_cents`) au
moment de l'inscription, puis réécrit uniquement quand le bureau change son
type de cotisation. Réviser le tarif général ne modifie donc pas ce qu'une
adhérente devait pour sa saison : l'historique reste juste.

Toutes les lectures financières — tableau de bord, cotisations attendues, reste
à encaisser, statut de paiement, impayés, fiche, `recomputeMemberStatus()`,
Mollie, emails, comptabilité — partent de ce montant. 20 standards + 5
solidaires + 2 offertes font donc **4 500 €** attendus, et non 27 × 200 €.

Une cotisation offerte vaut 0 : l'adhérente n'apparaît dans aucun impayé et
devient `ACTIVE` d'elle-même, **sans aucune ligne de paiement de 0 €**. Une
adhésion annulée, elle, reste annulée quoi qu'il arrive.

Le changement se fait depuis la fiche, bouton *Modifier la cotisation*, avec
confirmation. Aucune raison n'est demandée et aucune catégorie de situation
personnelle n'est enregistrée : le bureau ajoute une note interne s'il le
souhaite.

### Échéanciers

Le public choisit **1 ou 2 fois**, le 1 fois étant mis en avant. Le **3 fois**
existe uniquement dans le CRM, accordé au cas par cas.

Les montants se répartissent en centimes entiers, les premières échéances
absorbant le reste : 200 € en 3 fois donnent 66,67 € + 66,67 € + 66,66 €, et
jamais un total de 200,01 €.

Un échéancier accepté n'est pas un impayé. La fiche et la liste distinguent
visuellement **« Paiement en cours — échéancier »** de **« Impayé »**. En
revanche `registration_status` reste `PENDING_PAYMENT` tant que la totalité du
montant dû n'est pas encaissée — sauf cotisation offerte.

### Mollie et les échéances

Le paiement en ligne ne propose jamais plus que l'échéance en cours :

| Situation | Prochain paiement carte |
| --- | --- |
| 2 fois, rien de payé | 100 € |
| 2 fois, 100 € payés | 100 € |
| 2 fois, 50 € déjà encaissés à la main | 50 € |
| 2 fois, 200 € payés | aucun paiement possible |
| Cotisation offerte | aucun paiement possible |

Tout est calculé côté serveur : la route ne lit que `memberId`, et un montant
envoyé par le navigateur reste sans effet.

### SMS

Aucun fournisseur externe, aucun abonnement, aucun envoi automatique. Les
boutons SMS ouvrent l'application Messages du téléphone avec le numéro et le
texte déjà remplis (`lib/sms.ts`) ; c'est toujours une personne du bureau qui
appuie sur « Envoyer ».

| Où | Quand | Message |
| --- | --- | --- |
| Feuille de présence | statut *Absente* | information d'absence, demande de confirmation |
| Feuille de présence | statut *En retard* | information de retard, ton neutre |
| Fiche et page Paiements | reste à régler > 0 | relance avec le montant restant calculé |

Le bouton de relance disparaît dès que le reste est nul.

## Comptabilité

`/admin/comptabilite` est un suivi de trésorerie, pas un logiciel comptable :
pas de partie double, pas de TVA, pas de plan comptable.

La page agrège deux sources :

- **A.** les lignes `payments` réellement encaissées — cotisations Mollie et
  saisies manuelles confondues ;
- **B.** la table `accounting_entries`, qui ne contient **que** les mouvements
  manuels : dons, subventions, achats, reversements.

Une cotisation n'est donc jamais saisie deux fois, et n'est **pas supprimable
depuis la Comptabilité** : sa correction reste dans le module Paiements, là où
elle a été créée. Les saisies manuelles, elles, se suppriment avec
confirmation.

### Reversement au club partenaire

Un encadré affiche le reversement à prévoir pour le groupe du dimanche :
nombre d'adhérentes non annulées × `settings.partner_club_fee_cents` (50 €).

C'est une **provision, pas une dépense**. Rien n'est écrit en base et aucune
dépense n'est créée automatiquement. « À prévoir : 1 500 € » et « déjà reversé :
500 € » sont deux chiffres distincts, et le second ne bouge que lorsque le
bureau saisit un reversement réel.

## Paiement en ligne et emails

### Parcours

1. L'adhérente termine le formulaire. L'inscription est créée en
   `PENDING_PAYMENT` avec son numéro `BSC-26-XXXX`.
2. Deux emails partent : confirmation à la famille, notification au bureau.
3. L'écran de confirmation propose les quatre moyens de paiement retenus à
   l'étape « mode de paiement » : carte, virement, chèque, espèces.
4. Carte : le navigateur appelle `/api/payments/mollie` avec **le seul
   identifiant de l'adhérente**. Le serveur relit la cotisation et le déjà-payé
   en base, calcule le reste dû, crée le paiement chez Mollie et renvoie
   l'URL de checkout.
5. Mollie appelle `/api/webhooks/mollie`. Le serveur **rappelle Mollie** pour
   lire le statut réel, marque l'encaissement, recalcule le statut de
   l'adhérente et envoie l'email « paiement reçu ».
6. L'adhérente revient sur `/inscription/paiement`, qui affiche l'état lu en
   base — pas l'état supposé par le navigateur.

### Règles de sécurité tenues par le code

- La clé Mollie n'est utilisée que côté serveur (`lib/mollie.ts`). Le
  navigateur ne voit que l'URL de checkout renvoyée par Mollie.
- **Aucun montant n'est accepté du client.** `/api/payments/mollie` ne lit que
  `memberId` ; le montant vient de `settings.annual_fee_cents` moins les
  encaissements déjà enregistrés.
- Le contenu du webhook n'est jamais une preuve de paiement : seul compte le
  `GET /payments/:id` refait vers Mollie.
- Idempotence : `payments.provider_payment_id` porte un index unique partiel, et
  l'encaissement comme l'envoi de l'email se font par `UPDATE … WHERE` +
  `RETURNING`, donc un webhook rejoué ne crée ni double encaissement ni second
  email.
- Une adhérente `CANCELLED` ne redevient jamais `ACTIVE` automatiquement, même
  si un paiement arrive (`recomputeMemberStatus`).
- Un paiement encaissé par Mollie ne peut pas être supprimé depuis le CRM
  comme une saisie manuelle.
- L'email au bureau ne contient **aucune donnée médicale**.

### Passage en production

Tant que `MOLLIE_API_KEY` commence par `test_`, aucun argent ne circule : les
paiements se règlent depuis l'écran de test de Mollie. Le passage à une clé
`live_` est une décision du bureau, à prendre une fois les tests terminés et le
compte Mollie validé. Rien d'autre n'est à changer dans le code.

### Webhook et Preview

Le webhook doit pouvoir être appelé par Mollie depuis l'extérieur. Une Preview
Vercel protégée par SSO renvoie une page de connexion à Mollie : le webhook
n'arrive jamais. Pour tester le parcours complet sur une Preview, il faut
lever la protection de déploiement sur cette URL, ou tester sur la Production.

## Base de données

Douze tables, décrites dans `lib/db/schema.ts` :

`members`, `guardians`, `emergency_contacts`, `medical_info`, `consents`,
`payments`, `sessions` (séances d'entraînement), `attendance`, `notes`,
`documents`, `accounting_entries` (mouvements de trésorerie manuels),
`settings`.

Une inscription crée en une transaction : 1 `members`, 1 `guardians`,
1 `emergency_contacts`, 1 `medical_info` et exactement 3 `consents`
(`INTERNAL_RULES`, `PARENTAL_AUTHORIZATION`, `IMAGE_RIGHTS` — la ligne existe
même en cas de refus, avec `accepted = false`). L'adhérente démarre en
`registration_status = PENDING_PAYMENT`.

Cinq conventions à connaître :

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
- **`members.fee_amount_cents`** est le montant dû par CETTE adhérente, figé à
  l'inscription. C'est lui, et jamais `settings.annual_fee_cents`, que lisent
  les calculs financiers.

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

Les quatre variables obligatoires (`DATABASE_URL`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD`, `SESSION_SECRET`) doivent être cochées pour **Production ET
Preview** dans *Settings → Environment Variables*. Une variable absente d'un
environnement y donne un 500 sur toutes les pages qui lisent la base.

Les variables du paiement et des emails (`MOLLIE_API_KEY`, `RESEND_API_KEY`,
`RESEND_FROM_EMAIL`, `APP_URL`) s'ajoutent au même endroit. Les poser en type
*Encrypted*, jamais en type *Secret* : un *Secret* rouvert affiche une valeur
vide et l'enregistrer écrase la vraie valeur par du vide — c'est ce qui avait
mis toutes les pages en 500 à l'étape 2.

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
  inscription/paiement/     Retour après paiement Mollie
  informations/             Informations pratiques
  reglement/                Règlement intérieur
  admin/
    login/                  Connexion + server actions
    (protected)/            Pages protégées (layout qui exige la session)
      page.tsx              Tableau de bord
      adherentes/
      paiements/
      presences/
      comptabilite/         Trésorerie : recettes, dépenses, solde
  api/
    registration/route.ts
    payments/route.ts
    payments/mollie/route.ts   Ouverture d'un paiement carte
    attendance/route.ts
    webhooks/mollie/route.ts   Notification Mollie (source de vérité : Mollie)
components/admin/sms-button.tsx  Lien sms: prérempli (aucun envoi automatique)
components/site-header.tsx  En-tête public (menu mobile)
components/site-footer.tsx  Pied de page public
lib/
  auth.ts                   Session admin (cookie signé)
  constants.ts              Classes, statuts, libellés, formatage
  validation.ts             Schémas Zod (dont un par étape du formulaire)
  settings.ts               Lecture de la table settings (tarif, créneaux)
  registration.ts           Création d'une inscription
  payments.ts               Paiement Mollie : ouverture et confirmation
  mollie.ts                 Appels à l'API Mollie
  email.ts                  Envoi Resend (n'échoue jamais bruyamment)
  notifications.ts          Contenu des emails transactionnels
  app-url.ts                URL publique (retour et webhook)
  crm.ts                    Lectures du CRM et statuts calculés
  fees.ts                   Types de cotisation et découpage en échéances
  accounting.ts             Agrégation trésorerie (paiements + saisies)
  sms.ts                    Messages préremplis pour les liens sms:
  db/index.ts               Client Drizzle + Neon
  db/schema.ts              Schéma des tables
drizzle/                    Migrations SQL générées
scripts/seed.ts             Réglages initiaux
```

## À faire ensuite

Non implémenté pour l'instant, volontairement :

- **Relances** — email automatique aux inscriptions restées impayées.
- **Qonto** — rapprochement des virements reçus avec les paiements attendus.
- Export comptable (CSV) des mouvements de la saison.
- **Cloudflare R2** — certificats médicaux, autorisations parentales et
  signatures. La table `documents` (`file_key`) est déjà prévue.
- Export CSV de la liste des adhérentes.
