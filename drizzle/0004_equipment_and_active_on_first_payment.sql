ALTER TABLE "members" ADD COLUMN "equipment_delivered" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "equipment_delivered_at" timestamp with time zone;--> statement-breakpoint
-- Nouvelle règle : l'adhésion est validée dès le premier euro encaissé.
-- Les adhérentes déjà inscrites doivent en bénéficier, sinon celles qui ont
-- réglé une première échéance resteraient « en attente » et n'apparaîtraient
-- pas en feuille de présence.
--
-- Une adhésion annulée n'est jamais réactivée ici, comme partout ailleurs.
UPDATE "members" AS m
SET "registration_status" = 'ACTIVE'
WHERE m."registration_status" = 'PENDING_PAYMENT'
  AND (
    m."fee_amount_cents" <= 0
    OR EXISTS (
      SELECT 1 FROM "payments" p
      WHERE p."member_id" = m."id" AND p."status" = 'paid' AND p."amount_cents" > 0
    )
  );--> statement-breakpoint
-- Symétrique : une adhérente passée ACTIVE sous l'ancienne règle mais qui
-- n'a rien réglé et doit quelque chose redescend en attente.
UPDATE "members" AS m
SET "registration_status" = 'PENDING_PAYMENT'
WHERE m."registration_status" = 'ACTIVE'
  AND m."fee_amount_cents" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "payments" p
    WHERE p."member_id" = m."id" AND p."status" = 'paid' AND p."amount_cents" > 0
  );
