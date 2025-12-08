import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

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
