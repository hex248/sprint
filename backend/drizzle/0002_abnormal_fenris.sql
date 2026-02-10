CREATE TABLE "Issue" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Issue_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"projectId" integer NOT NULL,
	"number" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" varchar(2048) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Project" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Project_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"blob" varchar(4) NOT NULL,
	"name" varchar(256) NOT NULL,
	"ownerId" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_User_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_project_issue_number" ON "Issue" USING btree ("projectId","number");