import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
    ApiErrorSchema,
    AuthResponseSchema,
    CancelSubscriptionResponseSchema,
    CreateCheckoutSessionRequestSchema,
    CreateCheckoutSessionResponseSchema,
    CreatePortalSessionResponseSchema,
    GetSubscriptionResponseSchema,
    IssueByIdQuerySchema,
    IssueCommentCreateRequestSchema,
    IssueCommentDeleteRequestSchema,
    IssueCommentRecordSchema,
    IssueCommentResponseSchema,
    IssueCommentsByIssueQuerySchema,
    IssueCreateRequestSchema,
    IssueDeleteRequestSchema,
    IssueRecordSchema,
    IssueResponseSchema,
    IssuesByProjectQuerySchema,
    IssuesReplaceStatusRequestSchema,
    IssuesReplaceTypeRequestSchema,
    IssuesStatusCountQuerySchema,
    IssuesTypeCountQuerySchema,
    IssueUpdateRequestSchema,
    LoginRequestSchema,
    OrgAddMemberRequestSchema,
    OrganisationMemberRecordSchema,
    OrganisationMemberResponseSchema,
    OrganisationRecordSchema,
    OrganisationResponseSchema,
    OrgByIdQuerySchema,
    OrgCreateRequestSchema,
    OrgDeleteRequestSchema,
    OrgMembersQuerySchema,
    OrgMemberTimeTrackingQuerySchema,
    OrgRemoveMemberRequestSchema,
    OrgUpdateMemberRoleRequestSchema,
    OrgUpdateRequestSchema,
    ProjectByCreatorQuerySchema,
    ProjectByIdQuerySchema,
    ProjectByOrgQuerySchema,
    ProjectCreateRequestSchema,
    ProjectDeleteRequestSchema,
    ProjectRecordSchema,
    ProjectResponseSchema,
    ProjectUpdateRequestSchema,
    ProjectWithCreatorResponseSchema,
    RegisterRequestSchema,
    ReplaceStatusResponseSchema,
    ReplaceTypeResponseSchema,
    SprintCreateRequestSchema,
    SprintDeleteRequestSchema,
    SprintRecordSchema,
    SprintsByProjectQuerySchema,
    SprintUpdateRequestSchema,
    StatusCountResponseSchema,
    SuccessResponseSchema,
    TimerEndRequestSchema,
    TimerGetQuerySchema,
    TimerListItemSchema,
    TimerStateSchema,
    TimerToggleRequestSchema,
    TypeCountResponseSchema,
    UserByUsernameQuerySchema,
    UserResponseSchema,
    UserUpdateRequestSchema,
} from "./api-schemas";

const c = initContract();

const csrfHeaderSchema = z.object({
    "X-CSRF-Token": z.string(),
});

const emptyBodySchema = z.object({});

const timerInactiveResponseSchema = z.array(
    z.object({
        id: z.number(),
        userId: z.number(),
        issueId: z.number().nullable(),
        timestamps: z.array(z.string()),
        endedAt: z.string().nullable(),
        createdAt: z.string().nullable().optional(),
        workTimeMs: z.number(),
        breakTimeMs: z.number(),
    }),
);

const timerListItemResponseSchema = z.union([
    TimerListItemSchema,
    z.object({
        id: z.number(),
        userId: z.number(),
        issueId: z.number().nullable(),
        timestamps: z.array(z.string()),
        endedAt: z.string().nullable(),
        createdAt: z.string().nullable().optional(),
        workTimeMs: z.number(),
        breakTimeMs: z.number(),
        isRunning: z.boolean(),
    }),
]);

const timersQuerySchema = z.object({
    limit: z.coerce.number().int().positive().optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
    activeOnly: z.coerce.boolean().optional(),
});

export const apiContract = c.router({
    authRegister: {
        method: "POST",
        path: "/auth/register",
        body: RegisterRequestSchema,
        responses: {
            200: AuthResponseSchema,
            400: ApiErrorSchema,
            409: ApiErrorSchema,
        },
    },
    authLogin: {
        method: "POST",
        path: "/auth/login",
        body: LoginRequestSchema,
        responses: {
            200: AuthResponseSchema,
            401: ApiErrorSchema,
        },
    },
    authLogout: {
        method: "POST",
        path: "/auth/logout",
        body: emptyBodySchema,
        responses: {
            200: SuccessResponseSchema,
        },
        headers: csrfHeaderSchema,
    },
    authMe: {
        method: "GET",
        path: "/auth/me",
        responses: {
            200: AuthResponseSchema,
            401: ApiErrorSchema,
            404: ApiErrorSchema,
        },
    },

    userByUsername: {
        method: "GET",
        path: "/user/by-username",
        query: UserByUsernameQuerySchema,
        responses: {
            200: UserResponseSchema,
            404: ApiErrorSchema,
        },
    },
    userUpdate: {
        method: "POST",
        path: "/user/update",
        body: UserUpdateRequestSchema,
        responses: {
            200: UserResponseSchema,
            400: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    userUploadAvatar: {
        method: "POST",
        path: "/user/upload-avatar",
        contentType: "multipart/form-data",
        body: z.instanceof(FormData),
        responses: {
            200: z.object({ avatarURL: z.string() }),
            400: ApiErrorSchema,
            403: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },

    issueCreate: {
        method: "POST",
        path: "/issue/create",
        body: IssueCreateRequestSchema,
        responses: {
            200: IssueRecordSchema,
            400: ApiErrorSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    issueById: {
        method: "GET",
        path: "/issue/by-id",
        query: IssueByIdQuerySchema,
        responses: {
            200: IssueResponseSchema,
            404: ApiErrorSchema,
        },
    },
    issueUpdate: {
        method: "POST",
        path: "/issue/update",
        body: IssueUpdateRequestSchema,
        responses: {
            200: IssueRecordSchema,
            400: ApiErrorSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    issueDelete: {
        method: "POST",
        path: "/issue/delete",
        body: IssueDeleteRequestSchema,
        responses: {
            200: SuccessResponseSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },

    issuesByProject: {
        method: "GET",
        path: "/issues/by-project",
        query: IssuesByProjectQuerySchema,
        responses: {
            200: z.array(IssueResponseSchema),
        },
    },
    issuesAll: {
        method: "GET",
        path: "/issues/all",
        responses: {
            200: z.array(IssueResponseSchema),
        },
    },
    issuesReplaceStatus: {
        method: "POST",
        path: "/issues/replace-status",
        body: IssuesReplaceStatusRequestSchema,
        responses: {
            200: ReplaceStatusResponseSchema,
            403: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    issuesReplaceType: {
        method: "POST",
        path: "/issues/replace-type",
        body: IssuesReplaceTypeRequestSchema,
        responses: {
            200: ReplaceTypeResponseSchema,
            403: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    issuesStatusCount: {
        method: "GET",
        path: "/issues/status-count",
        query: IssuesStatusCountQuerySchema,
        responses: {
            200: StatusCountResponseSchema,
        },
    },
    issuesTypeCount: {
        method: "GET",
        path: "/issues/type-count",
        query: IssuesTypeCountQuerySchema,
        responses: {
            200: TypeCountResponseSchema,
        },
    },

    issueCommentsByIssue: {
        method: "GET",
        path: "/issue-comments/by-issue",
        query: IssueCommentsByIssueQuerySchema,
        responses: {
            200: z.array(IssueCommentResponseSchema),
        },
    },
    issueCommentCreate: {
        method: "POST",
        path: "/issue-comment/create",
        body: IssueCommentCreateRequestSchema,
        responses: {
            200: IssueCommentRecordSchema,
            400: ApiErrorSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    issueCommentDelete: {
        method: "POST",
        path: "/issue-comment/delete",
        body: IssueCommentDeleteRequestSchema,
        responses: {
            200: SuccessResponseSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },

    organisationCreate: {
        method: "POST",
        path: "/organisation/create",
        body: OrgCreateRequestSchema,
        responses: {
            200: OrganisationRecordSchema,
            400: ApiErrorSchema,
            409: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    organisationById: {
        method: "GET",
        path: "/organisation/by-id",
        query: OrgByIdQuerySchema,
        responses: {
            200: OrganisationRecordSchema,
            404: ApiErrorSchema,
        },
    },
    organisationUpdate: {
        method: "POST",
        path: "/organisation/update",
        body: OrgUpdateRequestSchema,
        responses: {
            200: OrganisationRecordSchema,
            400: ApiErrorSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    organisationDelete: {
        method: "POST",
        path: "/organisation/delete",
        body: OrgDeleteRequestSchema,
        responses: {
            200: SuccessResponseSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    organisationUploadIcon: {
        method: "POST",
        path: "/organisation/upload-icon",
        contentType: "multipart/form-data",
        body: z.instanceof(FormData),
        responses: {
            200: z.object({ iconURL: z.string() }),
            400: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    organisationAddMember: {
        method: "POST",
        path: "/organisation/add-member",
        body: OrgAddMemberRequestSchema,
        responses: {
            200: OrganisationMemberRecordSchema,
            400: ApiErrorSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
            409: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    organisationMembers: {
        method: "GET",
        path: "/organisation/members",
        query: OrgMembersQuerySchema,
        responses: {
            200: z.array(OrganisationMemberResponseSchema),
        },
    },
    organisationMemberTimeTracking: {
        method: "GET",
        path: "/organisation/member-time-tracking",
        query: OrgMemberTimeTrackingQuerySchema,
        responses: {
            200: z.array(
                z.object({
                    id: z.number(),
                    userId: z.number(),
                    issueId: z.number(),
                    issueNumber: z.number(),
                    projectKey: z.string(),
                    timestamps: z.array(z.string()),
                    endedAt: z.string().nullable(),
                    createdAt: z.string().nullable(),
                    workTimeMs: z.number(),
                    breakTimeMs: z.number(),
                    isRunning: z.boolean(),
                }),
            ),
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
    },
    organisationRemoveMember: {
        method: "POST",
        path: "/organisation/remove-member",
        body: OrgRemoveMemberRequestSchema,
        responses: {
            200: SuccessResponseSchema,
            400: ApiErrorSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    organisationUpdateMemberRole: {
        method: "POST",
        path: "/organisation/update-member-role",
        body: OrgUpdateMemberRoleRequestSchema,
        responses: {
            200: OrganisationMemberRecordSchema,
            400: ApiErrorSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    organisationsByUser: {
        method: "GET",
        path: "/organisations/by-user",
        responses: {
            200: z.array(OrganisationResponseSchema),
        },
    },

    projectCreate: {
        method: "POST",
        path: "/project/create",
        body: ProjectCreateRequestSchema,
        responses: {
            200: ProjectRecordSchema,
            400: ApiErrorSchema,
            403: ApiErrorSchema,
            409: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    projectUpdate: {
        method: "POST",
        path: "/project/update",
        body: ProjectUpdateRequestSchema,
        responses: {
            200: ProjectRecordSchema,
            400: ApiErrorSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    projectDelete: {
        method: "POST",
        path: "/project/delete",
        body: ProjectDeleteRequestSchema,
        responses: {
            200: SuccessResponseSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    projectWithCreator: {
        method: "GET",
        path: "/project/with-creator",
        query: ProjectByIdQuerySchema,
        responses: {
            200: ProjectWithCreatorResponseSchema,
            404: ApiErrorSchema,
        },
    },
    projectsByCreator: {
        method: "GET",
        path: "/projects/by-creator",
        query: ProjectByCreatorQuerySchema,
        responses: {
            200: z.array(ProjectWithCreatorResponseSchema),
        },
    },
    projectsByOrganisation: {
        method: "GET",
        path: "/projects/by-organisation",
        query: ProjectByOrgQuerySchema,
        responses: {
            200: z.array(ProjectResponseSchema),
        },
    },
    projectsAll: {
        method: "GET",
        path: "/projects/all",
        responses: {
            200: z.array(ProjectWithCreatorResponseSchema),
        },
    },
    projectsWithCreators: {
        method: "GET",
        path: "/projects/with-creators",
        responses: {
            200: z.array(ProjectWithCreatorResponseSchema),
        },
    },

    sprintCreate: {
        method: "POST",
        path: "/sprint/create",
        body: SprintCreateRequestSchema,
        responses: {
            200: SprintRecordSchema,
            400: ApiErrorSchema,
            403: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    sprintUpdate: {
        method: "POST",
        path: "/sprint/update",
        body: SprintUpdateRequestSchema,
        responses: {
            200: SprintRecordSchema,
            400: ApiErrorSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    sprintDelete: {
        method: "POST",
        path: "/sprint/delete",
        body: SprintDeleteRequestSchema,
        responses: {
            200: SuccessResponseSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    sprintsByProject: {
        method: "GET",
        path: "/sprints/by-project",
        query: SprintsByProjectQuerySchema,
        responses: {
            200: z.array(SprintRecordSchema),
        },
    },

    timerToggle: {
        method: "POST",
        path: "/timer/toggle",
        body: TimerToggleRequestSchema,
        responses: {
            200: TimerStateSchema,
            400: ApiErrorSchema,
            403: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    timerEnd: {
        method: "POST",
        path: "/timer/end",
        body: TimerEndRequestSchema,
        responses: {
            200: TimerStateSchema,
            400: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    timerGet: {
        method: "GET",
        path: "/timer/get",
        query: TimerGetQuerySchema,
        responses: {
            200: TimerStateSchema,
        },
    },
    timerGetInactive: {
        method: "GET",
        path: "/timer/get-inactive",
        query: TimerGetQuerySchema,
        responses: {
            200: timerInactiveResponseSchema.nullable(),
        },
    },
    timers: {
        method: "GET",
        path: "/timers",
        query: timersQuerySchema,
        responses: {
            200: z.array(timerListItemResponseSchema),
        },
    },

    subscriptionCreateCheckoutSession: {
        method: "POST",
        path: "/subscription/create-checkout-session",
        body: CreateCheckoutSessionRequestSchema,
        responses: {
            200: CreateCheckoutSessionResponseSchema,
            400: ApiErrorSchema,
            404: ApiErrorSchema,
            500: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    subscriptionCreatePortalSession: {
        method: "POST",
        path: "/subscription/create-portal-session",
        body: emptyBodySchema,
        responses: {
            200: CreatePortalSessionResponseSchema,
            404: ApiErrorSchema,
            500: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    subscriptionCancel: {
        method: "POST",
        path: "/subscription/cancel",
        body: emptyBodySchema,
        responses: {
            200: CancelSubscriptionResponseSchema,
            404: ApiErrorSchema,
            500: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    subscriptionGet: {
        method: "GET",
        path: "/subscription/get",
        responses: {
            200: GetSubscriptionResponseSchema,
            500: ApiErrorSchema,
        },
    },

    authVerifyEmail: {
        method: "POST",
        path: "/auth/verify-email",
        body: z.object({ code: z.string() }),
        responses: {
            200: SuccessResponseSchema,
            400: ApiErrorSchema,
            401: ApiErrorSchema,
            404: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
    authResendVerification: {
        method: "POST",
        path: "/auth/resend-verification",
        body: emptyBodySchema,
        responses: {
            200: SuccessResponseSchema,
            400: ApiErrorSchema,
            401: ApiErrorSchema,
        },
        headers: csrfHeaderSchema,
    },
});

export type ApiContract = typeof apiContract;
