ALTER TABLE "User" ADD COLUMN "email" varchar(255);--> statement-breakpoint
UPDATE "User" SET "email" = 'user_' || id || '@placeholder.local' WHERE "email" IS NULL;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_email_unique" UNIQUE("email");