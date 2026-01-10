export type {
    IssueInsert,
    IssueRecord,
    IssueResponse,
    OrganisationInsert,
    OrganisationMemberInsert,
    OrganisationMemberRecord,
    OrganisationMemberResponse,
    OrganisationRecord,
    OrganisationResponse,
    ProjectInsert,
    ProjectRecord,
    ProjectResponse,
    SessionInsert,
    SessionRecord,
    TimedSessionInsert,
    TimedSessionRecord,
    UserInsert,
    UserRecord,
} from "./schema";
export {
    Issue,
    IssueInsertSchema,
    IssueSelectSchema,
    Organisation,
    OrganisationInsertSchema,
    OrganisationMember,
    OrganisationMemberInsertSchema,
    OrganisationMemberSelectSchema,
    OrganisationSelectSchema,
    Project,
    ProjectInsertSchema,
    ProjectSelectSchema,
    Session,
    SessionInsertSchema,
    SessionSelectSchema,
    TimedSession,
    TimedSessionInsertSchema,
    TimedSessionSelectSchema,
    User,
    UserInsertSchema,
    UserSelectSchema,
} from "./schema";

export const ORG_NAME_MAX_LENGTH = 256;
export const ORG_DESCRIPTION_MAX_LENGTH = 1024;
export const ORG_SLUG_MAX_LENGTH = 64;

export const PROJECT_NAME_MAX_LENGTH = 256;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 1024;
export const PROJECT_SLUG_MAX_LENGTH = 64;

export const ISSUE_TITLE_MAX_LENGTH = 256;
export const ISSUE_DESCRIPTION_MAX_LENGTH = 2048;
export const ISSUE_STATUS_MAX_LENGTH = 24;

export { calculateBreakTimeMs, calculateWorkTimeMs, isTimerRunning } from "./utils/time-tracking";
