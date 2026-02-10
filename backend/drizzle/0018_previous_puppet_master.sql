CREATE TABLE "IssueAssignee" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "IssueAssignee_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"issueId" integer NOT NULL,
	"userId" integer NOT NULL,
	"assignedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_assigneeId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "IssueAssignee" ADD CONSTRAINT "IssueAssignee_issueId_Issue_id_fk" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "IssueAssignee" ADD CONSTRAINT "IssueAssignee_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_issue_user" ON "IssueAssignee" USING btree ("issueId","userId");--> statement-breakpoint
ALTER TABLE "Issue" DROP COLUMN "assigneeId";