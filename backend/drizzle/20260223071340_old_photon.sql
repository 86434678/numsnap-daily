CREATE TABLE "prize_claims" (
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
ALTER TABLE "user" ADD COLUMN "age_verified" boolean DEFAULT false NOT NULL;