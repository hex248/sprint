CREATE TABLE "Sprint" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Sprint_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"projectId" integer NOT NULL,
	"name" varchar(64) NOT NULL,
	"color" varchar(7) DEFAULT '#a1a1a1' NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "Issue" ADD COLUMN "sprintId" integer;--> statement-breakpoint
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_sprintId_Sprint_id_fk" FOREIGN KEY ("sprintId") REFERENCES "public"."Sprint"("id") ON DELETE no action ON UPDATE no action;