CREATE TABLE "accounting_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"label" text NOT NULL,
	"entry_date" date NOT NULL,
	"season" text NOT NULL,
	"payment_method" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "fee_type" text DEFAULT 'STANDARD' NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "fee_amount_cents" integer DEFAULT 20000 NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "payment_installments" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX "accounting_entries_season_idx" ON "accounting_entries" USING btree ("season");--> statement-breakpoint
CREATE INDEX "accounting_entries_date_idx" ON "accounting_entries" USING btree ("entry_date");--> statement-breakpoint
-- Adhérentes déjà inscrites : elles gardent la cotisation de leur saison,
-- lue dans `settings`, et non une valeur devinée dans le DDL ci-dessus.
UPDATE "members"
SET "fee_amount_cents" = COALESCE(
  (SELECT NULLIF("value", '')::int FROM "settings" WHERE "key" = 'annual_fee_cents'),
  20000
);--> statement-breakpoint
-- Tarif solidaire et reversement au club partenaire : des réglages, pas des
-- constantes codées en dur dans l'application.
INSERT INTO "settings" ("key", "value")
VALUES ('solidarity_fee_cents', '10000'), ('partner_club_fee_cents', '5000')
ON CONFLICT ("key") DO NOTHING;
