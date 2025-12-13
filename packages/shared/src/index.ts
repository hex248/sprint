// Drizzle tables
export { User, Project, Issue } from "./schema";

// Types
export type {
    UserRecord,
    UserInsert,
    ProjectRecord,
    ProjectInsert,
    IssueRecord,
    IssueInsert,
} from "./schema";

// Zod schemas
export {
    UserSelectSchema,
    UserInsertSchema,
    ProjectSelectSchema,
    ProjectInsertSchema,
    IssueSelectSchema,
    IssueInsertSchema,
} from "./schema";
