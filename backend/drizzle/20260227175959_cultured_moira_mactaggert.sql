ALTER TABLE "user" ADD COLUMN "verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "is_manual_entry" boolean DEFAULT false NOT NULL;