ALTER TABLE "Issue" ALTER COLUMN "title" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "Organisation" ALTER COLUMN "name" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "Project" ALTER COLUMN "name" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "iconPreference" varchar(10) DEFAULT 'lucide' NOT NULL;