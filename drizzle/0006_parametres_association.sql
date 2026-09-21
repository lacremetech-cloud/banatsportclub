-- Réglages pilotés depuis /admin/parametres.
--
-- Aucune modification de schéma : tout tient dans la table `settings`, déjà
-- en place. La migration ne fait qu'y déposer les valeurs de départ.
--
-- ON CONFLICT DO NOTHING, volontairement : si le bureau a déjà saisi une de
-- ces valeurs depuis l'interface, la migration ne doit pas la remplacer par
-- la valeur d'origine.
INSERT INTO "settings" ("key", "value") VALUES
  ('club_name',  'Banat Sport Club'),
  ('club_email', 'banatsportclub@gmail.com'),
  ('club_phone', '06 25 77 35 92'),
  ('bank_holder', 'BANAT SPORT CLUB'),
  ('bank_iban',   'FR76 1695 8000 0183 1400 7247 186'),
  ('bank_bic',    'QNTOFRP1XXX'),
  -- Libellés courts du CRM. Le parcours public garde les intitulés détaillés
  -- (niveaux, nom exact du gymnase, adresse) : ce sont deux usages différents.
  ('group_jeudi_short_label',    'Jeudi soir — Dojo'),
  ('group_dimanche_short_label', 'Dimanche matin — Stade Grabels')
ON CONFLICT ("key") DO NOTHING;
