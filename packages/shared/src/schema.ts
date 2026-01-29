import { boolean, integer, json, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import {
    ISSUE_COMMENT_MAX_LENGTH,
    ISSUE_DESCRIPTION_MAX_LENGTH,
    ISSUE_STATUS_MAX_LENGTH,
    ISSUE_TITLE_MAX_LENGTH,
    ISSUE_TYPE_MAX_LENGTH,
    ORG_DESCRIPTION_MAX_LENGTH,
    ORG_NAME_MAX_LENGTH,
    ORG_SLUG_MAX_LENGTH,
    PROJECT_NAME_MAX_LENGTH,
    USER_EMAIL_MAX_LENGTH,
    USER_NAME_MAX_LENGTH,
    USER_USERNAME_MAX_LENGTH,
} from "./constants";

export const DEFAULT_SPRINT_COLOUR = "#a1a1a1";

export const DEFAULT_STATUS_COLOUR = "#a1a1a1";

export const DEFAULT_STATUS_COLOURS: Record<string, string> = {
    "TO DO": "#fafafa",
    "IN PROGRESS": "#f97316",
    REVIEW: "#8952bc",
    DONE: "#22c55e",
    REJECTED: "#ef4444",
    ARCHIVED: DEFAULT_STATUS_COLOUR,
    MERGED: DEFAULT_STATUS_COLOUR,
};

export const DEFAULT_ISSUE_TYPES: Record<string, { icon: string; color: string }> = {
    Task: { icon: "checkBox", color: "#e4bd47" },
    Bug: { icon: "bug", color: "#ef4444" },
};

export const DEFAULT_FEATURES: Record<string, boolean> = {
    userAvatars: true,

    issueTypes: true,
    issueStatus: true,
    issueDescriptions: true,
    issueTimeTracking: true,
    issueAssignees: true,
    issueAssigneesShownInTable: true,
    issueCreator: true,
    issueComments: true,

    sprints: true,
};

export const iconStyles = ["pixel", "lucide", "phosphor"] as const;
export type IconStyle = (typeof iconStyles)[number];

export const User = pgTable("User", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: USER_NAME_MAX_LENGTH }).notNull(),
    username: varchar({ length: USER_USERNAME_MAX_LENGTH }).notNull().unique(),
    email: varchar({ length: USER_EMAIL_MAX_LENGTH }).notNull().unique(),
    passwordHash: varchar({ length: 255 }).notNull(),
    avatarURL: varchar({ length: 512 }),
    iconPreference: varchar({ length: 10 }).notNull().default("pixel").$type<IconStyle>(),
    plan: varchar({ length: 32 }).notNull().default("free"),
    emailVerified: boolean().notNull().default(false),
    emailVerifiedAt: timestamp({ withTimezone: false }),
    createdAt: timestamp({ withTimezone: false }).defaultNow(),
    updatedAt: timestamp({ withTimezone: false }).defaultNow(),
});

export const Organisation = pgTable("Organisation", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: ORG_NAME_MAX_LENGTH }).notNull(),
    description: varchar({ length: ORG_DESCRIPTION_MAX_LENGTH }),
    slug: varchar({ length: ORG_SLUG_MAX_LENGTH }).notNull().unique(),
    iconURL: varchar({ length: 512 }),
    statuses: json("statuses").$type<Record<string, string>>().notNull().default(DEFAULT_STATUS_COLOURS),
    issueTypes: json("issueTypes")
        .$type<Record<string, { icon: string; color: string }>>()
        .notNull()
        .default(DEFAULT_ISSUE_TYPES),
    features: json("features").$type<Record<string, boolean>>().notNull().default(DEFAULT_FEATURES),
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
    name: varchar({ length: PROJECT_NAME_MAX_LENGTH }).notNull(),
    organisationId: integer()
        .notNull()
        .references(() => Organisation.id),
    creatorId: integer()
        .notNull()
        .references(() => User.id),
});

export const Sprint = pgTable("Sprint", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    projectId: integer()
        .notNull()
        .references(() => Project.id),
    name: varchar({ length: 64 }).notNull(),
    color: varchar({ length: 7 }).notNull().default(DEFAULT_SPRINT_COLOUR),
    startDate: timestamp({ withTimezone: false }).notNull(),
    endDate: timestamp({ withTimezone: false }).notNull(),
    createdAt: timestamp({ withTimezone: false }).defaultNow(),
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

export const TimedSession = pgTable("TimedSession", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
        .notNull()
        .references(() => User.id),
    issueId: integer().references(() => Issue.id, { onDelete: "set null" }),
    timestamps: timestamp({ withTimezone: false }).array().notNull(),
    endedAt: timestamp({ withTimezone: false }),
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

        type: varchar({ length: ISSUE_TYPE_MAX_LENGTH }).notNull().default("Task"),
        status: varchar({ length: ISSUE_STATUS_MAX_LENGTH }).notNull().default("TO DO"),
        title: varchar({ length: ISSUE_TITLE_MAX_LENGTH }).notNull(),
        description: varchar({ length: ISSUE_DESCRIPTION_MAX_LENGTH }).notNull(),

        creatorId: integer()
            .notNull()
            .references(() => User.id),

        sprintId: integer().references(() => Sprint.id),
    },
    (t) => [
        // ensures unique numbers per project
        // you can have Issue 1 in PROJ and Issue 1 in TEST, but not two Issue 1s in PROJ
        uniqueIndex("unique_project_issue_number").on(t.projectId, t.number),
    ],
);

export const IssueAssignee = pgTable(
    "IssueAssignee",
    {
        id: integer().primaryKey().generatedAlwaysAsIdentity(),
        issueId: integer()
            .notNull()
            .references(() => Issue.id, { onDelete: "cascade" }),
        userId: integer()
            .notNull()
            .references(() => User.id, { onDelete: "cascade" }),
        assignedAt: timestamp({ withTimezone: false }).defaultNow(),
    },
    (t) => [uniqueIndex("unique_issue_user").on(t.issueId, t.userId)],
);

export const IssueComment = pgTable("IssueComment", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    issueId: integer()
        .notNull()
        .references(() => Issue.id, { onDelete: "cascade" }),
    userId: integer()
        .notNull()
        .references(() => User.id, { onDelete: "cascade" }),
    body: varchar({ length: ISSUE_COMMENT_MAX_LENGTH }).notNull(),
    createdAt: timestamp({ withTimezone: false }).defaultNow(),
    updatedAt: timestamp({ withTimezone: false }).defaultNow(),
});

export const UserSelectSchema = createSelectSchema(User);
export const UserInsertSchema = createInsertSchema(User);

export const OrganisationSelectSchema = createSelectSchema(Organisation);
export const OrganisationInsertSchema = createInsertSchema(Organisation);

export const OrganisationMemberSelectSchema = createSelectSchema(OrganisationMember);
export const OrganisationMemberInsertSchema = createInsertSchema(OrganisationMember);

export const ProjectSelectSchema = createSelectSchema(Project);
export const ProjectInsertSchema = createInsertSchema(Project);

export const SprintSelectSchema = createSelectSchema(Sprint);
export const SprintInsertSchema = createInsertSchema(Sprint);

export const IssueSelectSchema = createSelectSchema(Issue);
export const IssueInsertSchema = createInsertSchema(Issue);

export const IssueAssigneeSelectSchema = createSelectSchema(IssueAssignee);
export const IssueAssigneeInsertSchema = createInsertSchema(IssueAssignee);

export const IssueCommentSelectSchema = createSelectSchema(IssueComment);
export const IssueCommentInsertSchema = createInsertSchema(IssueComment);

export const SessionSelectSchema = createSelectSchema(Session);
export const SessionInsertSchema = createInsertSchema(Session);

export const TimedSessionSelectSchema = createSelectSchema(TimedSession);
export const TimedSessionInsertSchema = createInsertSchema(TimedSession);

export type UserRecord = z.infer<typeof UserSelectSchema>;
export type UserInsert = z.infer<typeof UserInsertSchema>;

export type OrganisationRecord = z.infer<typeof OrganisationSelectSchema> & {
    statuses: Record<string, string>;
    features: Record<string, boolean>;
};
export type OrganisationInsert = z.infer<typeof OrganisationInsertSchema>;

export type OrganisationMemberRecord = z.infer<typeof OrganisationMemberSelectSchema>;
export type OrganisationMemberInsert = z.infer<typeof OrganisationMemberInsertSchema>;

export type ProjectRecord = z.infer<typeof ProjectSelectSchema>;
export type ProjectInsert = z.infer<typeof ProjectInsertSchema>;

export type SprintRecord = z.infer<typeof SprintSelectSchema>;
export type SprintInsert = z.infer<typeof SprintInsertSchema>;

export type IssueRecord = z.infer<typeof IssueSelectSchema>;
export type IssueInsert = z.infer<typeof IssueInsertSchema>;

export type IssueAssigneeRecord = z.infer<typeof IssueAssigneeSelectSchema>;
export type IssueAssigneeInsert = z.infer<typeof IssueAssigneeInsertSchema>;

export type IssueCommentRecord = z.infer<typeof IssueCommentSelectSchema>;
export type IssueCommentInsert = z.infer<typeof IssueCommentInsertSchema>;

export type SessionRecord = z.infer<typeof SessionSelectSchema>;
export type SessionInsert = z.infer<typeof SessionInsertSchema>;

export type TimedSessionRecord = z.infer<typeof TimedSessionSelectSchema>;
export type TimedSessionInsert = z.infer<typeof TimedSessionInsertSchema>;

export type IssueResponse = {
    Issue: IssueRecord;
    Creator: UserRecord;
    Assignees: UserRecord[];
};

export type IssueCommentResponse = {
    Comment: IssueCommentRecord;
    User: UserRecord;
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

export type TimerState = {
    id: number;
    workTimeMs: number;
    breakTimeMs: number;
    isRunning: boolean;
    timestamps: string[];
    endedAt: string | null;
} | null;

export const Subscription = pgTable("Subscription", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
        .notNull()
        .references(() => User.id),
    stripeCustomerId: varchar({ length: 255 }),
    stripeSubscriptionId: varchar({ length: 255 }),
    stripeSubscriptionItemId: varchar({ length: 255 }),
    stripePriceId: varchar({ length: 255 }),
    status: varchar({ length: 32 }).notNull().default("incomplete"),
    currentPeriodStart: timestamp({ withTimezone: false }),
    currentPeriodEnd: timestamp({ withTimezone: false }),
    cancelAtPeriodEnd: boolean().notNull().default(false),
    trialEnd: timestamp({ withTimezone: false }),
    quantity: integer().notNull().default(1),
    createdAt: timestamp({ withTimezone: false }).defaultNow(),
    updatedAt: timestamp({ withTimezone: false }).defaultNow(),
});

export const Payment = pgTable("Payment", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    subscriptionId: integer()
        .notNull()
        .references(() => Subscription.id),
    stripePaymentIntentId: varchar({ length: 255 }),
    amount: integer().notNull(),
    currency: varchar({ length: 3 }).notNull().default("gbp"),
    status: varchar({ length: 32 }).notNull(),
    createdAt: timestamp({ withTimezone: false }).defaultNow(),
});

export const SubscriptionSelectSchema = createSelectSchema(Subscription);
export const SubscriptionInsertSchema = createInsertSchema(Subscription);

export const PaymentSelectSchema = createSelectSchema(Payment);
export const PaymentInsertSchema = createInsertSchema(Payment);

export type SubscriptionRecord = z.infer<typeof SubscriptionSelectSchema>;
export type SubscriptionInsert = z.infer<typeof SubscriptionInsertSchema>;

export type PaymentRecord = z.infer<typeof PaymentSelectSchema>;
export type PaymentInsert = z.infer<typeof PaymentInsertSchema>;

export const EmailVerification = pgTable("EmailVerification", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
        .notNull()
        .references(() => User.id, { onDelete: "cascade" }),
    code: varchar({ length: 6 }).notNull(),
    attempts: integer().notNull().default(0),
    maxAttempts: integer().notNull().default(5),
    expiresAt: timestamp({ withTimezone: false }).notNull(),
    verifiedAt: timestamp({ withTimezone: false }),
    createdAt: timestamp({ withTimezone: false }).defaultNow(),
});

export const EmailVerificationSelectSchema = createSelectSchema(EmailVerification);
export const EmailVerificationInsertSchema = createInsertSchema(EmailVerification);

export type EmailVerificationRecord = z.infer<typeof EmailVerificationSelectSchema>;
export type EmailVerificationInsert = z.infer<typeof EmailVerificationInsertSchema>;

export const EmailJob = pgTable("EmailJob", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
        .notNull()
        .references(() => User.id, { onDelete: "cascade" }),
    type: varchar({ length: 64 }).notNull(),
    scheduledFor: timestamp({ withTimezone: false }).notNull(),
    sentAt: timestamp({ withTimezone: false }),
    failedAt: timestamp({ withTimezone: false }),
    errorMessage: text(),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp({ withTimezone: false }).defaultNow(),
});

export const EmailJobSelectSchema = createSelectSchema(EmailJob);
export const EmailJobInsertSchema = createInsertSchema(EmailJob);

export type EmailJobRecord = z.infer<typeof EmailJobSelectSchema>;
export type EmailJobInsert = z.infer<typeof EmailJobInsertSchema>;
