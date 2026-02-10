CREATE TABLE "Organisation" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Organisation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(256) NOT NULL,
	"description" varchar(1024),
	"slug" varchar(64) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "Organisation_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "OrganisationMember" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "OrganisationMember_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organisationId" integer NOT NULL,
	"userId" integer NOT NULL,
	"role" varchar(32) NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "Project" RENAME COLUMN "ownerId" TO "creatorId";--> statement-breakpoint
ALTER TABLE "Project" DROP CONSTRAINT "Project_ownerId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Project" ADD COLUMN "organisationId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "OrganisationMember" ADD CONSTRAINT "OrganisationMember_organisationId_Organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."Organisation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrganisationMember" ADD CONSTRAINT "OrganisationMember_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_organisationId_Organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."Organisation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_creatorId_User_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;