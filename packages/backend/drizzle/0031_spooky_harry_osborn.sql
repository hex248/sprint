ALTER TABLE "Sprint" ADD COLUMN "open" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "Sprint" ADD COLUMN "handOffs" integer[] DEFAULT '{}' NOT NULL;