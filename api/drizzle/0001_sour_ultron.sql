CREATE TABLE IF NOT EXISTS "geocode_cache" (
	"query" text PRIMARY KEY NOT NULL,
	"lat" text,
	"lng" text,
	"display_name" text,
	"found" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
