import { integer, pgTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const User = pgTable("User", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 256 }).notNull(),
    username: varchar({ length: 32 }).notNull().unique(),
    passwordHash: varchar({ length: 255 }).notNull(),
    avatarURL: varchar({ length: 512 }),
    createdAt: timestamp({ withTimezone: false }).defaultNow(),
    updatedAt: timestamp({ withTimezone: false }).defaultNow(),
});

export const Organisation = pgTable("Organisation", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 256 }).notNull(),
    description: varchar({ length: 1024 }),
    slug: varchar({ length: 64 }).notNull().unique(),
    createdAt: timestamp({ withTimezone: false }).defaultNow(),
    updatedAt: timestamp({ withTimezone: false }).defaultNow(),
});

export const OrganisationMember = pgTable("OrganisationMember", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    organisationId: integer()
        .notNull()
        .references(() => Organisation.id),
    userId: integer()
        .notNull()
        .references(() => User.id),
    role: varchar({ length: 32 }).notNull(),
    createdAt: timestamp({ withTimezone: false }).defaultNow(),
});

export const Project = pgTable("Project", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    key: varchar({ length: 4 }).notNull(),
    name: varchar({ length: 256 }).notNull(),
    organisationId: integer()
        .notNull()
        .references(() => Organisation.id),
    creatorId: integer()
        .notNull()
        .references(() => User.id),
});

export const Session = pgTable("Session", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
        .notNull()
        .references(() => User.id),
    csrfToken: varchar({ length: 64 }).notNull(),
    expiresAt: timestamp({ withTimezone: false }).notNull(),
    createdAt: timestamp({ withTimezone: false }).defaultNow(),
});

export const Issue = pgTable(
    "Issue",
    {
        id: integer().primaryKey().generatedAlwaysAsIdentity(),
        projectId: integer()
            .notNull()
            .references(() => Project.id),

        number: integer("number").notNull(),

        title: varchar({ length: 256 }).notNull(),
        description: varchar({ length: 2048 }).notNull(),

        creatorId: integer()
            .notNull()
            .references(() => User.id),
        assigneeId: integer().references(() => User.id),
    },
    (t) => [
        // ensures unique numbers per project
        // you can have Issue 1 in PROJ and Issue 1 in TEST, but not two Issue 1s in PROJ
        uniqueIndex("unique_project_issue_number").on(t.projectId, t.number),
    ],
);

// Zod schemas
export const UserSelectSchema = createSelectSchema(User);
export const UserInsertSchema = createInsertSchema(User);

export const OrganisationSelectSchema = createSelectSchema(Organisation);
export const OrganisationInsertSchema = createInsertSchema(Organisation);

export const OrganisationMemberSelectSchema = createSelectSchema(OrganisationMember);
export const OrganisationMemberInsertSchema = createInsertSchema(OrganisationMember);

export const ProjectSelectSchema = createSelectSchema(Project);
export const ProjectInsertSchema = createInsertSchema(Project);

export const IssueSelectSchema = createSelectSchema(Issue);
export const IssueInsertSchema = createInsertSchema(Issue);

export const SessionSelectSchema = createSelectSchema(Session);
export const SessionInsertSchema = createInsertSchema(Session);

// Types
export type UserRecord = z.infer<typeof UserSelectSchema>;
export type UserInsert = z.infer<typeof UserInsertSchema>;

export type OrganisationRecord = z.infer<typeof OrganisationSelectSchema>;
export type OrganisationInsert = z.infer<typeof OrganisationInsertSchema>;

export type OrganisationMemberRecord = z.infer<typeof OrganisationMemberSelectSchema>;
export type OrganisationMemberInsert = z.infer<typeof OrganisationMemberInsertSchema>;

export type ProjectRecord = z.infer<typeof ProjectSelectSchema>;
export type ProjectInsert = z.infer<typeof ProjectInsertSchema>;

export type IssueRecord = z.infer<typeof IssueSelectSchema>;
export type IssueInsert = z.infer<typeof IssueInsertSchema>;

export type SessionRecord = z.infer<typeof SessionSelectSchema>;
export type SessionInsert = z.infer<typeof SessionInsertSchema>;

// Responses

export type IssueResponse = {
    Issue: IssueRecord;
    Creator: UserRecord;
    Assignee: UserRecord | null;
};

export type ProjectResponse = {
    Project: ProjectRecord;
    Organisation: OrganisationRecord;
    User: UserRecord;
};

export type OrganisationResponse = {
    Organisation: OrganisationRecord;
    OrganisationMember: OrganisationMemberRecord;
};

export type OrganisationMemberResponse = {
    OrganisationMember: OrganisationMemberRecord;
    Organisation: OrganisationRecord;
    User: UserRecord;
};
