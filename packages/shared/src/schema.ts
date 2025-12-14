import { integer, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const User = pgTable("User", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 256 }).notNull(),
    username: varchar({ length: 32 }).notNull().unique(),
});

export const Project = pgTable("Project", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    blob: varchar({ length: 4 }).notNull(),
    name: varchar({ length: 256 }).notNull(),
    ownerId: integer()
        .notNull()
        .references(() => User.id),
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

export const ProjectSelectSchema = createSelectSchema(Project);
export const ProjectInsertSchema = createInsertSchema(Project);

export const IssueSelectSchema = createSelectSchema(Issue);
export const IssueInsertSchema = createInsertSchema(Issue);

// Types
export type UserRecord = z.infer<typeof UserSelectSchema>;
export type UserInsert = z.infer<typeof UserInsertSchema>;

export type ProjectRecord = z.infer<typeof ProjectSelectSchema>;
export type ProjectInsert = z.infer<typeof ProjectInsertSchema>;

export type IssueRecord = z.infer<typeof IssueSelectSchema>;
export type IssueInsert = z.infer<typeof IssueInsertSchema>;
