CREATE TABLE "Attachment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Attachment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organisationId" integer NOT NULL,
	"uploaderId" integer NOT NULL,
	"issueId" integer,
	"issueCommentId" integer,
	"s3Key" varchar(512) NOT NULL,
	"url" varchar(512) NOT NULL,
	"mimeType" varchar(32) NOT NULL,
	"sizeBytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "Attachment_s3Key_unique" UNIQUE("s3Key")
);
--> statement-breakpoint
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_organisationId_Organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."Organisation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploaderId_User_id_fk" FOREIGN KEY ("uploaderId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_issueId_Issue_id_fk" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_issueCommentId_IssueComment_id_fk" FOREIGN KEY ("issueCommentId") REFERENCES "public"."IssueComment"("id") ON DELETE cascade ON UPDATE no action;