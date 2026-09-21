-- Archives et corbeille du CRM.
--
-- Deux dates nullables, et rien d'autre : aucune suppression physique n'est
-- possible depuis l'application. Une fiche sortie des listes garde ses
-- paiements, ses présences, ses notes, ses consentements et ses contacts.
--
-- Les deux états se lisent ensemble : `trashed_at` l'emporte sur
-- `archived_at`. Mettre à la corbeille une adhérente archivée conserve donc
-- `archived_at`, ce qui permet de la restaurer dans l'état où elle était.
--
-- `registration_status` n'est pas touché : le statut d'adhésion
-- (PENDING_PAYMENT / ACTIVE / CANCELLED) et l'état CRM sont deux choses
-- différentes, et CANCELLED ne doit jamais servir à ranger une fiche.
ALTER TABLE "members" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "trashed_at" timestamp with time zone;--> statement-breakpoint
-- Les listes courantes filtrent sur ces colonnes à chaque lecture.
CREATE INDEX "members_archived_idx" ON "members" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "members_trashed_idx" ON "members" USING btree ("trashed_at");
