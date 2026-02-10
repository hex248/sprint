CREATE TABLE "CliLoginCode" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "CliLoginCode_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"deviceCodeHash" varchar(128) NOT NULL,
	"userCodeHash" varchar(128) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"pollIntervalSeconds" integer DEFAULT 5 NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"lastPolledAt" timestamp,
	"approvedByUserId" integer,
	"sessionId" integer,
	"approvedAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "CliLoginCode_deviceCodeHash_unique" UNIQUE("deviceCodeHash"),
	CONSTRAINT "CliLoginCode_userCodeHash_unique" UNIQUE("userCodeHash")
);
--> statement-breakpoint
ALTER TABLE "CliLoginCode" ADD CONSTRAINT "CliLoginCode_approvedByUserId_User_id_fk" FOREIGN KEY ("approvedByUserId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CliLoginCode" ADD CONSTRAINT "CliLoginCode_sessionId_Session_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE set null ON UPDATE no action;