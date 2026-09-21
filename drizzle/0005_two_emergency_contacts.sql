ALTER TABLE "emergency_contacts" ALTER COLUMN "last_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD COLUMN "priority" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "emergency_contacts_member_priority_unique" ON "emergency_contacts" USING btree ("member_id","priority");--> statement-breakpoint
-- Les lieux affichés viennent de `settings` : la migration les met à jour en
-- même temps que le code, pour qu'aucun déploiement n'affiche encore
-- « Dojo Montpellier » ou « Stade de Grabels ».
INSERT INTO "settings" ("key", "value") VALUES
  ('group_jeudi_day',      'Jeudi soir'),
  ('group_jeudi_levels',   '6e à 3e'),
  ('group_jeudi_place',    'Complexe sportif des Garrigues — Haut de Massane'),
  ('group_jeudi_address',  '297 Av. du Comté de Nice, 34080 Montpellier'),
  ('group_dimanche_day',     'Dimanche matin'),
  ('group_dimanche_levels',  '3e à Terminale'),
  ('group_dimanche_place',   'Stade Serge Oltra — Grabels'),
  ('group_dimanche_address', 'Rue du Mas d''Armand, 34790 Grabels')
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value";
