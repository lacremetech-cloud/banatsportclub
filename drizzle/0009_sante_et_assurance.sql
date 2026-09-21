-- Fiche sanitaire déclarative et assurance individuelle accident.
--
-- Trois colonnes, aucune pièce jointe. Le formulaire ne demande ni certificat
-- médical (plus exigible pour une mineure depuis le décret n° 2021-1105), ni
-- attestation d'assurance : l'obligation d'assurance pèse sur l'association
-- (article L321-1 du code du sport), pas sur les familles. Stocker des
-- documents supposerait un bucket, une durée de conservation et une purge —
-- rien de tout ça n'est nécessaire pour l'usage réel.
--
-- `has_health_issue` est la colonne qui change tout : sans elle, trois champs
-- de texte vides sont ambigus, et « aucune allergie » ne se distingue pas de
-- « formulaire traversé sans être lu ». Son défaut `false` vaut « rien à
-- signaler », ce qui décrit correctement les fiches antérieures.
--
-- `insurance_status` est déclaratif : YES / NO / UNKNOWN. Le défaut UNKNOWN
-- se lit « non renseignée », jamais « non couverte » — une fiche créée avant
-- que la question existe ne doit pas accuser une famille peut-être assurée.
ALTER TABLE "medical_info" ADD COLUMN "has_health_issue" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "medical_info" ADD COLUMN "carries_emergency_treatment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "insurance_status" text DEFAULT 'UNKNOWN' NOT NULL;