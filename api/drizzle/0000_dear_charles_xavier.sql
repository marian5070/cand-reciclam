CREATE TYPE "public"."building_type" AS ENUM('case', 'blocuri');--> statement-breakpoint
CREATE TYPE "public"."exception_action" AS ENUM('canceled', 'moved_to');--> statement-breakpoint
CREATE TYPE "public"."parity" AS ENUM('odd', 'even', 'both');--> statement-breakpoint
CREATE TYPE "public"."source_quality" AS ENUM('street_number', 'sector_uniform', 'provisional', 'manual');--> statement-breakpoint
CREATE TYPE "public"."waste_type" AS ENUM('menajer', 'reciclabil_uscat', 'bio', 'voluminoase', 'deee', 'textile', 'sticla');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disposal_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"waste_type" "waste_type" NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"lat" text,
	"lng" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedback_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"schedule_id" integer,
	"reported_date" timestamp,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "operators" (
	"id" serial PRIMARY KEY NOT NULL,
	"sector_id" integer NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"phone" text,
	"email" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedule_exceptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"action" "exception_action" NOT NULL,
	"moved_to" timestamp,
	"note" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_id" integer NOT NULL,
	"waste_type" "waste_type" NOT NULL,
	"rrule" text NOT NULL,
	"building_type" "building_type",
	"source_quality" "source_quality" DEFAULT 'manual' NOT NULL,
	"source_url" text,
	"source_note" text,
	"source_fetched_at" timestamp with time zone,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sectors" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "street_segments" (
	"id" serial PRIMARY KEY NOT NULL,
	"street_id" integer NOT NULL,
	"sector_id" integer NOT NULL,
	"number_from" integer,
	"number_to" integer,
	"parity" "parity" DEFAULT 'both' NOT NULL,
	"zone_id" integer,
	"source_url" text,
	"source_fetched_at" timestamp with time zone,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "streets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"street_id" integer,
	"street_number" integer,
	"push_endpoint" text,
	"push_p256dh" text,
	"push_auth" text,
	"notify_hour" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"sector_id" integer NOT NULL,
	"name" text NOT NULL,
	"operator_id" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback_reports" ADD CONSTRAINT "feedback_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback_reports" ADD CONSTRAINT "feedback_reports_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "operators" ADD CONSTRAINT "operators_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "street_segments" ADD CONSTRAINT "street_segments_street_id_streets_id_fk" FOREIGN KEY ("street_id") REFERENCES "public"."streets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "street_segments" ADD CONSTRAINT "street_segments_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "street_segments" ADD CONSTRAINT "street_segments_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_street_id_streets_id_fk" FOREIGN KEY ("street_id") REFERENCES "public"."streets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "zones" ADD CONSTRAINT "zones_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "zones" ADD CONSTRAINT "zones_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "street_segments_street_idx" ON "street_segments" USING btree ("street_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "streets_slug_idx" ON "streets" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "streets_name_trgm_idx" ON "streets" USING btree ("name");