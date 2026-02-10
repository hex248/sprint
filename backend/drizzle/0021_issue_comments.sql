CREATE TABLE "IssueComment" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "issueId" integer NOT NULL REFERENCES "Issue" ("id") ON DELETE CASCADE,
    "userId" integer NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
    "body" varchar(2048) NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
);
