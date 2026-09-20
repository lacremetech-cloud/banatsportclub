CREATE SEQUENCE "public"."member_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "registration_status" SET DEFAULT 'PENDING_PAYMENT';--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "preferred_payment_method" text;