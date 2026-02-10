ALTER TABLE "TimedSession" DROP CONSTRAINT "TimedSession_issueId_Issue_id_fk";
--> statement-breakpoint
ALTER TABLE "TimedSession" ALTER COLUMN "issueId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "TimedSession" ADD CONSTRAINT "TimedSession_issueId_Issue_id_fk" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE set null ON UPDATE no action;