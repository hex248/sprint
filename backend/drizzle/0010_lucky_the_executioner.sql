CREATE TABLE "Session" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Session_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"csrfToken" varchar(64) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "TimedSession" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "TimedSession_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"issueId" integer NOT NULL,
	"timestamps" timestamp[] NOT NULL,
	"endedAt" timestamp,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TimedSession" ADD CONSTRAINT "TimedSession_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TimedSession" ADD CONSTRAINT "TimedSession_issueId_Issue_id_fk" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE no action ON UPDATE no action;