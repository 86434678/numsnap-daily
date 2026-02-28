CREATE TABLE IF NOT EXISTS "daily_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_number" integer NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_numbers_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prize_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"submission_id" uuid NOT NULL,
	"payment_method" text NOT NULL,
	"payment_info" text NOT NULL,
	"confirmed_accuracy" boolean NOT NULL,
	"claim_status" text DEFAULT 'pending' NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"processed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"photo_url" text NOT NULL,
	"detected_number" integer NOT NULL,
	"confirmed_number" integer NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"city" text,
	"is_manual_entry" boolean DEFAULT false NOT NULL,
	"submission_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reveal_time_pst" timestamp with time zone,
	"is_winner" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_stats" (
	"user_id" text PRIMARY KEY NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"total_submissions" integer DEFAULT 0 NOT NULL,
	"total_wins" integer DEFAULT 0 NOT NULL,
	"last_submission_date" date
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user" ADD COLUMN "age_verified" boolean DEFAULT false NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user" ADD COLUMN "age" integer;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user" ADD COLUMN "age_verified_at" timestamp with time zone;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user" ADD COLUMN "verified" boolean DEFAULT false NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
