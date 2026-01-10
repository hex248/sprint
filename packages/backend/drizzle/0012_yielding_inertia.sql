ALTER TABLE "Issue" ALTER COLUMN "status" SET DATA TYPE varchar(24);--> statement-breakpoint
ALTER TABLE "Issue" ALTER COLUMN "status" SET DEFAULT 'TO DO';--> statement-breakpoint
ALTER TABLE "Organisation" ALTER COLUMN "statuses" SET DATA TYPE varchar(24)[];--> statement-breakpoint
ALTER TABLE "Organisation" ALTER COLUMN "statuses" SET DEFAULT '{"TO DO","IN PROGRESS","REVIEW","DONE","ARCHIVED","MERGED"}';--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "name" SET DATA TYPE varchar(64);