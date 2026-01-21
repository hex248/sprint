CREATE TABLE "IssueComment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "IssueComment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"issueId" integer NOT NULL,
	"userId" integer NOT NULL,
	"body" varchar(2048) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "IssueComment" ADD CONSTRAINT "IssueComment_issueId_Issue_id_fk" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "IssueComment" ADD CONSTRAINT "IssueComment_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;