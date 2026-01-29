import { z } from "zod";
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
import { DEFAULT_FEATURES } from "./schema";

// error response

export const ApiErrorSchema = z.object({
    error: z.string(),
    code: z.string().optional(),
    details: z.record(z.array(z.string())).optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// auth schemas

export const LoginRequestSchema = z.object({
    username: z.string().min(1, "Username is required").max(USER_USERNAME_MAX_LENGTH),
    password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
    name: z.string().min(1, "Name is required").max(USER_NAME_MAX_LENGTH),
    username: z
        .string()
        .min(1, "Username is required")
        .max(USER_USERNAME_MAX_LENGTH)
        .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
    email: z.string().min(1, "Email is required").email("Invalid email address").max(USER_EMAIL_MAX_LENGTH),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain an uppercase letter")
        .regex(/[a-z]/, "Password must contain a lowercase letter")
        .regex(/[0-9]/, "Password must contain a number"),
    avatarURL: z.string().url().nullable().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const AuthResponseSchema = z.object({
    user: z.object({
        id: z.number(),
        name: z.string(),
        username: z.string(),
        avatarURL: z.string().nullable(),
        iconPreference: z.enum(["lucide", "pixel", "phosphor"]),
        emailVerified: z.boolean(),
    }),
    csrfToken: z.string(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// email verification schemas

export const VerifyEmailRequestSchema = z.object({
    code: z.string().length(6, "Verification code must be 6 digits"),
});

export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

// issue schemas

export const IssueCreateRequestSchema = z.object({
    projectId: z.number().int().positive("projectId must be a positive integer"),
    type: z.string().max(ISSUE_TYPE_MAX_LENGTH).optional(),
    status: z.string().max(ISSUE_STATUS_MAX_LENGTH).optional(),
    title: z.string().min(1, "Title is required").max(ISSUE_TITLE_MAX_LENGTH),
    description: z.string().max(ISSUE_DESCRIPTION_MAX_LENGTH).default(""),
    assigneeIds: z.array(z.number().int().positive()).optional(),
    sprintId: z.number().int().positive().nullable().optional(),
});

export type IssueCreateRequest = z.infer<typeof IssueCreateRequestSchema>;

export const IssueUpdateRequestSchema = z.object({
    id: z.number().int().positive("id must be a positive integer"),
    type: z.string().max(ISSUE_TYPE_MAX_LENGTH).optional(),
    status: z.string().max(ISSUE_STATUS_MAX_LENGTH).optional(),
    title: z.string().min(1, "Title must be at least 1 character").max(ISSUE_TITLE_MAX_LENGTH).optional(),
    description: z.string().max(ISSUE_DESCRIPTION_MAX_LENGTH).optional(),
    assigneeIds: z.array(z.number().int().positive()).nullable().optional(),
    sprintId: z.number().int().positive().nullable().optional(),
});

export type IssueUpdateRequest = z.infer<typeof IssueUpdateRequestSchema>;

export const IssueDeleteRequestSchema = z.object({
    id: z.number().int().positive("id must be a positive integer"),
});

export type IssueDeleteRequest = z.infer<typeof IssueDeleteRequestSchema>;

export const IssuesByProjectQuerySchema = z.object({
    projectId: z.coerce.number().int().positive("projectId must be a positive integer"),
});

export type IssuesByProjectQuery = z.infer<typeof IssuesByProjectQuerySchema>;

export const IssueByIdQuerySchema = z.object({
    issueId: z.coerce.number().int().positive("issueId must be a positive integer"),
});

export type IssueByIdQuery = z.infer<typeof IssueByIdQuerySchema>;

export const IssuesStatusCountQuerySchema = z.object({
    organisationId: z.coerce.number().int().positive("organisationId must be a positive integer"),
    status: z.string().min(1, "Status is required").max(ISSUE_STATUS_MAX_LENGTH),
});

export type IssuesStatusCountQuery = z.infer<typeof IssuesStatusCountQuerySchema>;

export const IssuesReplaceStatusRequestSchema = z.object({
    organisationId: z.number().int().positive("organisationId must be a positive integer"),
    oldStatus: z.string().min(1, "oldStatus is required").max(ISSUE_STATUS_MAX_LENGTH),
    newStatus: z.string().min(1, "newStatus is required").max(ISSUE_STATUS_MAX_LENGTH),
});

export type IssuesReplaceStatusRequest = z.infer<typeof IssuesReplaceStatusRequestSchema>;

export const IssuesTypeCountQuerySchema = z.object({
    organisationId: z.coerce.number().int().positive("organisationId must be a positive integer"),
    type: z.string().min(1, "Type is required").max(ISSUE_TYPE_MAX_LENGTH),
});

export type IssuesTypeCountQuery = z.infer<typeof IssuesTypeCountQuerySchema>;

export const IssuesReplaceTypeRequestSchema = z.object({
    organisationId: z.number().int().positive("organisationId must be a positive integer"),
    oldType: z.string().min(1, "oldType is required").max(ISSUE_TYPE_MAX_LENGTH),
    newType: z.string().min(1, "newType is required").max(ISSUE_TYPE_MAX_LENGTH),
});

export type IssuesReplaceTypeRequest = z.infer<typeof IssuesReplaceTypeRequestSchema>;

export const IssueCommentCreateRequestSchema = z.object({
    issueId: z.number().int().positive("issueId must be a positive integer"),
    body: z.string().min(1, "Comment is required").max(ISSUE_COMMENT_MAX_LENGTH),
});

export type IssueCommentCreateRequest = z.infer<typeof IssueCommentCreateRequestSchema>;

export const IssueCommentDeleteRequestSchema = z.object({
    id: z.number().int().positive("id must be a positive integer"),
});

export type IssueCommentDeleteRequest = z.infer<typeof IssueCommentDeleteRequestSchema>;

export const IssueCommentsByIssueQuerySchema = z.object({
    issueId: z.coerce.number().int().positive("issueId must be a positive integer"),
});

export type IssueCommentsByIssueQuery = z.infer<typeof IssueCommentsByIssueQuerySchema>;

// organisation schemas

export const OrgCreateRequestSchema = z.object({
    name: z.string().min(1, "Name is required").max(ORG_NAME_MAX_LENGTH),
    slug: z
        .string()
        .min(1, "Slug is required")
        .max(ORG_SLUG_MAX_LENGTH)
        .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    description: z.string().max(ORG_DESCRIPTION_MAX_LENGTH).optional(),
});

export type OrgCreateRequest = z.infer<typeof OrgCreateRequestSchema>;

export const OrgUpdateRequestSchema = z.object({
    id: z.number().int().positive("id must be a positive integer"),
    name: z.string().min(1, "Name must be at least 1 character").max(ORG_NAME_MAX_LENGTH).optional(),
    description: z.string().max(ORG_DESCRIPTION_MAX_LENGTH).optional(),
    slug: z
        .string()
        .min(1, "Slug must be at least 1 character")
        .max(ORG_SLUG_MAX_LENGTH)
        .regex(/^[a-z0-9-]+$/)
        .optional(),
    iconURL: z.string().url().max(512).nullable().optional(),
    statuses: z
        .record(z.string())
        .refine((obj) => Object.keys(obj).length > 0, "Statuses must have at least one entry")
        .refine(
            (obj) => Object.keys(obj).every((key) => key.length <= ISSUE_STATUS_MAX_LENGTH),
            `Status keys must be <= ${ISSUE_STATUS_MAX_LENGTH} characters`,
        )
        .optional(),
    features: z
        .record(z.boolean())
        .refine(
            (obj) => Object.keys(obj).length === Object.keys(DEFAULT_FEATURES).length,
            "Features must include all default features",
        )
        .optional(),
    issueTypes: z
        .record(z.object({ icon: z.string(), color: z.string() }))
        .refine((obj) => Object.keys(obj).length > 0, "Issue types must have at least one entry")
        .refine(
            (obj) => Object.keys(obj).every((key) => key.length <= ISSUE_TYPE_MAX_LENGTH),
            `Issue type keys must be <= ${ISSUE_TYPE_MAX_LENGTH} characters`,
        )
        .optional(),
});

export type OrgUpdateRequest = z.infer<typeof OrgUpdateRequestSchema>;

export const OrgDeleteRequestSchema = z.object({
    id: z.number().int().positive("id must be a positive integer"),
});

export type OrgDeleteRequest = z.infer<typeof OrgDeleteRequestSchema>;

export const OrgByIdQuerySchema = z.object({
    id: z.coerce.number().int().positive("id must be a positive integer"),
});

export type OrgByIdQuery = z.infer<typeof OrgByIdQuerySchema>;

export const OrgMembersQuerySchema = z.object({
    organisationId: z.coerce.number().int().positive("organisationId must be a positive integer"),
});

export type OrgMembersQuery = z.infer<typeof OrgMembersQuerySchema>;

export const OrgMemberTimeTrackingQuerySchema = z.object({
    organisationId: z.coerce.number().int().positive("organisationId must be a positive integer"),
    fromDate: z.coerce.date().optional(),
});

export type OrgMemberTimeTrackingQuery = z.infer<typeof OrgMemberTimeTrackingQuerySchema>;

export const OrgAddMemberRequestSchema = z.object({
    organisationId: z.number().int().positive("organisationId must be a positive integer"),
    userId: z.number().int().positive("userId must be a positive integer"),
    role: z.enum(["admin", "member"]).default("member"),
});

export type OrgAddMemberRequest = z.infer<typeof OrgAddMemberRequestSchema>;

export const OrgRemoveMemberRequestSchema = z.object({
    organisationId: z.number().int().positive("organisationId must be a positive integer"),
    userId: z.number().int().positive("userId must be a positive integer"),
});

export type OrgRemoveMemberRequest = z.infer<typeof OrgRemoveMemberRequestSchema>;

export const OrgUpdateMemberRoleRequestSchema = z.object({
    organisationId: z.number().int().positive("organisationId must be a positive integer"),
    userId: z.number().int().positive("userId must be a positive integer"),
    role: z.enum(["admin", "member"]),
});

export type OrgUpdateMemberRoleRequest = z.infer<typeof OrgUpdateMemberRoleRequestSchema>;

// project schemas

export const ProjectCreateRequestSchema = z.object({
    name: z.string().min(1, "Name is required").max(PROJECT_NAME_MAX_LENGTH),
    key: z
        .string()
        .min(1, "Key is required")
        .max(4, "Key must be 4 characters or less")
        .regex(/^[A-Za-z]{1,4}$/, "Key must be only letters A-Z"),
    organisationId: z.number().int().positive("organisationId must be a positive integer"),
});

export type ProjectCreateRequest = z.infer<typeof ProjectCreateRequestSchema>;

export const ProjectUpdateRequestSchema = z.object({
    id: z.number().int().positive("id must be a positive integer"),
    name: z.string().min(1, "Name must be at least 1 character").max(PROJECT_NAME_MAX_LENGTH).optional(),
    key: z
        .string()
        .min(1, "Key is required")
        .max(4, "Key must be 4 characters or less")
        .regex(/^[A-Za-z]{1,4}$/, "Key must be only letters A-Z")
        .optional(),
    creatorId: z.number().int().positive().optional(),
    organisationId: z.number().int().positive().optional(),
});

export type ProjectUpdateRequest = z.infer<typeof ProjectUpdateRequestSchema>;

export const ProjectDeleteRequestSchema = z.object({
    id: z.number().int().positive("id must be a positive integer"),
});

export type ProjectDeleteRequest = z.infer<typeof ProjectDeleteRequestSchema>;

export const ProjectByOrgQuerySchema = z.object({
    organisationId: z.coerce.number().int().positive("organisationId must be a positive integer"),
});

export type ProjectByOrgQuery = z.infer<typeof ProjectByOrgQuerySchema>;

export const ProjectByIdQuerySchema = z.object({
    id: z.coerce.number().int().positive("id must be a positive integer"),
});

export type ProjectByIdQuery = z.infer<typeof ProjectByIdQuerySchema>;

export const ProjectByCreatorQuerySchema = z.object({
    creatorId: z.coerce.number().int().positive("creatorId must be a positive integer"),
});

export type ProjectByCreatorQuery = z.infer<typeof ProjectByCreatorQuerySchema>;

// sprint schemas

export const SprintCreateRequestSchema = z
    .object({
        projectId: z.number().int().positive("projectId must be a positive integer"),
        name: z.string().min(1, "Name is required").max(64, "Name must be at most 64 characters"),
        color: z
            .string()
            .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color")
            .optional(),
        startDate: z.string().datetime("Start date must be a valid date"),
        endDate: z.string().datetime("End date must be a valid date"),
    })
    .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
        message: "End date must be after start date",
        path: ["endDate"],
    });

export type SprintCreateRequest = z.infer<typeof SprintCreateRequestSchema>;

export const SprintUpdateRequestSchema = z
    .object({
        id: z.number().int().positive("id must be a positive integer"),
        name: z.string().min(1, "Name is required").max(64, "Name must be at most 64 characters").optional(),
        color: z
            .string()
            .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color")
            .optional(),
        startDate: z.string().datetime("Start date must be a valid date").optional(),
        endDate: z.string().datetime("End date must be a valid date").optional(),
    })
    .refine(
        (data) => {
            if (data.startDate && data.endDate) {
                return new Date(data.startDate) <= new Date(data.endDate);
            }
            return true;
        },
        {
            message: "End date must be after start date",
            path: ["endDate"],
        },
    );

export type SprintUpdateRequest = z.infer<typeof SprintUpdateRequestSchema>;

export const SprintDeleteRequestSchema = z.object({
    id: z.number().int().positive("id must be a positive integer"),
});

export type SprintDeleteRequest = z.infer<typeof SprintDeleteRequestSchema>;

export const SprintsByProjectQuerySchema = z.object({
    projectId: z.coerce.number().int().positive("projectId must be a positive integer"),
});

export type SprintsByProjectQuery = z.infer<typeof SprintsByProjectQuerySchema>;

// timer schemas

export const TimerToggleRequestSchema = z.object({
    issueId: z.number().int().positive("issueId must be a positive integer"),
});

export type TimerToggleRequest = z.infer<typeof TimerToggleRequestSchema>;

export const TimerEndRequestSchema = z.object({
    issueId: z.number().int().positive("issueId must be a positive integer"),
});

export type TimerEndRequest = z.infer<typeof TimerEndRequestSchema>;

export const TimerGetQuerySchema = z.object({
    issueId: z.coerce.number().int().positive("issueId must be a positive integer"),
});

export type TimerGetQuery = z.infer<typeof TimerGetQuerySchema>;

// user schemas

export const UserUpdateRequestSchema = z.object({
    name: z.string().min(1, "Name must be at least 1 character").max(USER_NAME_MAX_LENGTH).optional(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain an uppercase letter")
        .regex(/[a-z]/, "Password must contain a lowercase letter")
        .regex(/[0-9]/, "Password must contain a number")
        .optional(),
    avatarURL: z.string().url().nullable().optional(),
    iconPreference: z.enum(["lucide", "pixel", "phosphor"]).optional(),
});

export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;

export const UserByUsernameQuerySchema = z.object({
    username: z.string().min(1, "Username is required"),
});

export type UserByUsernameQuery = z.infer<typeof UserByUsernameQuerySchema>;

// response schemas

export const UserResponseSchema = z.object({
    id: z.number(),
    name: z.string(),
    username: z.string(),
    avatarURL: z.string().nullable(),
    iconPreference: z.enum(["lucide", "pixel", "phosphor"]),
    plan: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

export const IssueRecordSchema = z.object({
    id: z.number(),
    projectId: z.number(),
    number: z.number(),
    type: z.string(),
    status: z.string(),
    title: z.string(),
    description: z.string(),
    creatorId: z.number(),
    sprintId: z.number().nullable(),
});

export const IssueResponseSchema = z.object({
    Issue: IssueRecordSchema,
    Creator: UserResponseSchema,
    Assignees: z.array(UserResponseSchema),
});

export type IssueResponse = z.infer<typeof IssueResponseSchema>;

export const IssueCommentRecordSchema = z.object({
    id: z.number(),
    issueId: z.number(),
    userId: z.number(),
    body: z.string(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
});

export const IssueCommentResponseSchema = z.object({
    Comment: IssueCommentRecordSchema,
    User: UserResponseSchema,
});

export type IssueCommentResponse = z.infer<typeof IssueCommentResponseSchema>;

export const OrganisationRecordSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    slug: z.string(),
    iconURL: z.string().nullable().optional(),
    statuses: z.record(z.string()),
    features: z.record(z.boolean()),
    issueTypes: z.record(z.object({ icon: z.string(), color: z.string() })),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
});

export type OrganisationRecordType = z.infer<typeof OrganisationRecordSchema>;

export const OrganisationMemberRecordSchema = z.object({
    id: z.number(),
    organisationId: z.number(),
    userId: z.number(),
    role: z.string(),
    createdAt: z.string().nullable().optional(),
});

export type OrganisationMemberRecordType = z.infer<typeof OrganisationMemberRecordSchema>;

export const OrganisationResponseSchema = z.object({
    Organisation: OrganisationRecordSchema,
    OrganisationMember: OrganisationMemberRecordSchema,
});

export type OrganisationResponse = z.infer<typeof OrganisationResponseSchema>;

export const OrganisationMemberResponseSchema = z.object({
    OrganisationMember: OrganisationMemberRecordSchema,
    Organisation: OrganisationRecordSchema,
    User: UserResponseSchema,
});

export type OrganisationMemberResponse = z.infer<typeof OrganisationMemberResponseSchema>;

export const ProjectRecordSchema = z.object({
    id: z.number(),
    key: z.string(),
    name: z.string(),
    organisationId: z.number(),
    creatorId: z.number(),
});

export const ProjectResponseSchema = z.object({
    Project: ProjectRecordSchema,
    Organisation: OrganisationRecordSchema,
    User: UserResponseSchema,
});

export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;

export const ProjectWithCreatorResponseSchema = z.object({
    Project: ProjectRecordSchema,
    User: UserResponseSchema,
});

export type ProjectWithCreatorResponse = z.infer<typeof ProjectWithCreatorResponseSchema>;

export const SprintRecordSchema = z.object({
    id: z.number(),
    projectId: z.number(),
    name: z.string(),
    color: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    createdAt: z.string().nullable().optional(),
});

export type SprintResponse = z.infer<typeof SprintRecordSchema>;

export const TimerStateSchema = z
    .object({
        id: z.number(),
        workTimeMs: z.number(),
        breakTimeMs: z.number(),
        isRunning: z.boolean(),
        timestamps: z.array(z.string()),
        endedAt: z.string().nullable(),
    })
    .nullable();

export type TimerStateType = z.infer<typeof TimerStateSchema>;

export const TimerListItemSchema = z.object({
    id: z.number(),
    issueId: z.number(),
    issueNumber: z.number(),
    projectKey: z.string(),
    workTimeMs: z.number(),
    breakTimeMs: z.number(),
    isRunning: z.boolean(),
    timestamps: z.array(z.string()),
    endedAt: z.string().nullable(),
});

export type TimerListItem = z.infer<typeof TimerListItemSchema>;

export const TimerListResponseSchema = z.array(TimerListItemSchema);

export type TimerListResponse = z.infer<typeof TimerListResponseSchema>;

export const StatusCountResponseSchema = z.array(
    z.object({
        status: z.string(),
        count: z.number(),
    }),
);

export type StatusCountResponse = z.infer<typeof StatusCountResponseSchema>;

export const ReplaceStatusResponseSchema = z.object({
    rowCount: z.number(),
});

export type ReplaceStatusResponse = z.infer<typeof ReplaceStatusResponseSchema>;

export const TypeCountResponseSchema = z.object({
    count: z.number(),
});

export type TypeCountResponse = z.infer<typeof TypeCountResponseSchema>;

export const ReplaceTypeResponseSchema = z.object({
    rowCount: z.number(),
});

export type ReplaceTypeResponse = z.infer<typeof ReplaceTypeResponseSchema>;

// general

export const SuccessResponseSchema = z.object({
    success: z.boolean(),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

// subscription schemas

export const CreateCheckoutSessionRequestSchema = z.object({
    billingPeriod: z.enum(["monthly", "annual"]),
});

export type CreateCheckoutSessionRequest = z.infer<typeof CreateCheckoutSessionRequestSchema>;

export const CreateCheckoutSessionResponseSchema = z.object({
    url: z.string(),
});

export type CreateCheckoutSessionResponse = z.infer<typeof CreateCheckoutSessionResponseSchema>;

export const CreatePortalSessionResponseSchema = z.object({
    url: z.string(),
});

export type CreatePortalSessionResponse = z.infer<typeof CreatePortalSessionResponseSchema>;

export const SubscriptionRecordSchema = z.object({
    id: z.number(),
    userId: z.number(),
    stripeCustomerId: z.string().nullable(),
    stripeSubscriptionId: z.string().nullable(),
    stripeSubscriptionItemId: z.string().nullable(),
    stripePriceId: z.string().nullable(),
    status: z.string(),
    currentPeriodStart: z.string().nullable().optional(),
    currentPeriodEnd: z.string().nullable().optional(),
    cancelAtPeriodEnd: z.boolean(),
    trialEnd: z.string().nullable().optional(),
    quantity: z.number(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
});

export type SubscriptionRecord = z.infer<typeof SubscriptionRecordSchema>;

export const GetSubscriptionResponseSchema = z.object({
    subscription: SubscriptionRecordSchema.nullable(),
});

export type GetSubscriptionResponse = z.infer<typeof GetSubscriptionResponseSchema>;

export const CancelSubscriptionResponseSchema = z.object({
    subscription: SubscriptionRecordSchema,
});

export type CancelSubscriptionResponse = z.infer<typeof CancelSubscriptionResponseSchema>;
