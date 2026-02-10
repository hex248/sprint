ALTER TABLE "User" ADD COLUMN "passwordHash" varchar(255);--> statement-breakpoint
UPDATE "User" SET "passwordHash" = '$2b$10$VJ0sxL2D0Nb3rFe58nZh0epCWnpx3Kc4y0kf14U.iSaJykhDoOwgm' WHERE "passwordHash" IS NULL;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "updatedAt" timestamp DEFAULT now();
