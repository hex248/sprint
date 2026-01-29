CREATE TABLE "EmailJob" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "EmailJob_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"type" varchar(64) NOT NULL,
	"scheduledFor" timestamp NOT NULL,
	"sentAt" timestamp,
	"failedAt" timestamp,
	"errorMessage" text,
	"metadata" json,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "EmailVerification" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "EmailVerification_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"code" varchar(6) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"maxAttempts" integer DEFAULT 5 NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"verifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "email" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "emailVerified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" timestamp;--> statement-breakpoint
ALTER TABLE "EmailJob" ADD CONSTRAINT "EmailJob_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;