DO $$ BEGIN
    CREATE TYPE "show_source" AS ENUM('manual', 'google_calendar');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "shows"
    ADD COLUMN IF NOT EXISTS "source" "show_source" NOT NULL DEFAULT 'manual';

ALTER TABLE "shows"
    ADD COLUMN IF NOT EXISTS "google_event_id" text;

ALTER TABLE "shows"
    ADD COLUMN IF NOT EXISTS "imported_at" timestamp with time zone;

ALTER TABLE "shows"
    ADD COLUMN IF NOT EXISTS "last_google_sync_at" timestamp with time zone;

DO $$ BEGIN
    ALTER TABLE "shows" ADD CONSTRAINT "shows_google_event_id_unique" UNIQUE("google_event_id");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "google_calendar_connections" (
    "id" serial PRIMARY KEY NOT NULL,
    "provider" text NOT NULL DEFAULT 'google_calendar',
    "google_calendar_id" text,
    "google_calendar_name" text,
    "encrypted_access_token" text NOT NULL,
    "encrypted_refresh_token" text,
    "token_expires_at" timestamp with time zone,
    "connected_by_user_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "google_calendar_connections_provider_unique" UNIQUE("provider")
);

DO $$ BEGIN
    ALTER TABLE "google_calendar_connections"
        ADD CONSTRAINT "google_calendar_connections_connected_by_user_id_users_table_id_fk"
        FOREIGN KEY ("connected_by_user_id")
        REFERENCES "users_table"("id")
        ON DELETE set null
        ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
