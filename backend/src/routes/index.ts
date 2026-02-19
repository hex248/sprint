import aiChat from "./ai/chat";
import aiModels from "./ai/models";
import attachmentUpload from "./attachment/upload";
import authLogin from "./auth/login";
import authLogout from "./auth/logout";
import authMe from "./auth/me";
import authRegister from "./auth/register";
import authResendVerification from "./auth/resend-verification";
import authVerifyEmail from "./auth/verify-email";
import cliLoginApprove from "./cli/login-approve";
import cliLoginPoll from "./cli/login-poll";
import cliLoginStart from "./cli/login-start";
import issueById from "./issue/by-id";
import issueCreate from "./issue/create";
import issueDelete from "./issue/delete";
import issueImportJiraCsv from "./issue/import-jira-csv";
import issueUpdate from "./issue/update";
import issueCommentCreate from "./issue-comment/create";
import issueCommentDelete from "./issue-comment/delete";
import issueCommentsByIssue from "./issue-comments/by-issue";
import issues from "./issues/all";
import issuesByProject from "./issues/by-project";
import issuesReplaceStatus from "./issues/replace-status";
import issuesReplaceType from "./issues/replace-type";
import issuesStatusCount from "./issues/status-count";
import issuesTypeCount from "./issues/type-count";
import organisationAddMember from "./organisation/add-member";
import organisationById from "./organisation/by-id";
import organisationsByUser from "./organisation/by-user";
import organisationCreate from "./organisation/create";
import organisationDelete from "./organisation/delete";
import organisationExport from "./organisation/export";
import organisationImport from "./organisation/import";
import organisationMemberTimeTracking from "./organisation/member-time-tracking";
import organisationMembers from "./organisation/members";
import organisationRemoveMember from "./organisation/remove-member";
import organisationUpdate from "./organisation/update";
import organisationUpdateMemberRole from "./organisation/update-member-role";
import organisationUploadIcon from "./organisation/upload-icon";
import projectsAll from "./project/all";
import projectsByCreator from "./project/by-creator";
import projectsByOrganisation from "./project/by-organisation";
import projectCreate from "./project/create";
import projectDelete from "./project/delete";
import projectUpdate from "./project/update";
import projectWithCreator from "./project/with-creator";
import projectsWithCreators from "./project/with-creators";
import rtcConfig from "./rtc/config";
import sprintClose from "./sprint/close";
import sprintCreate from "./sprint/create";
import sprintDelete from "./sprint/delete";
import sprintUpdate from "./sprint/update";
import sprintsByProject from "./sprints/by-project";
import subscriptionCancel from "./subscription/cancel";
import subscriptionCreateCheckoutSession from "./subscription/create-checkout-session";
import subscriptionCreatePortalSession from "./subscription/create-portal-session";
import subscriptionGet from "./subscription/get";
import subscriptionWebhook from "./subscription/webhook";
import timerEnd from "./timer/end";
import timerEndGlobal from "./timer/end-global";
import timerGet from "./timer/get";
import timerGetGlobal from "./timer/get-global";
import timerGetInactive from "./timer/get-inactive";
import timerGetInactiveGlobal from "./timer/get-inactive-global";
import timerToggle from "./timer/toggle";
import timerToggleGlobal from "./timer/toggle-global";
import timers from "./timers";
import userByUsername from "./user/by-username";
import userUpdate from "./user/update";
import userUploadAvatar from "./user/upload-avatar";

export const routes = {
    aiChat,
    aiModels,

    authRegister,
    authLogin,
    authLogout,
    authMe,
    rtcConfig,
    authVerifyEmail,
    authResendVerification,
    cliLoginStart,
    cliLoginPoll,
    cliLoginApprove,

    userByUsername,
    userUpdate,
    userUploadAvatar,
    attachmentUpload,

    issueCreate,
    issueById,
    issueDelete,
    issueImportJiraCsv,
    issueUpdate,

    issueCommentCreate,
    issueCommentDelete,
    issueCommentsByIssue,

    issuesByProject,
    issues,
    issuesReplaceStatus,
    issuesReplaceType,
    issuesStatusCount,
    issuesTypeCount,

    organisationCreate,
    organisationById,
    organisationExport,
    organisationImport,
    organisationUpdate,
    organisationDelete,
    organisationAddMember,
    organisationMemberTimeTracking,
    organisationMembers,
    organisationRemoveMember,
    organisationUpdateMemberRole,
    organisationUploadIcon,

    organisationsByUser,

    projectCreate,
    projectUpdate,
    projectDelete,
    projectWithCreator,

    projectsByCreator,
    projectsByOrganisation,
    projectsAll,
    projectsWithCreators,

    sprintCreate,
    sprintClose,
    sprintUpdate,
    sprintDelete,
    sprintsByProject,

    timerToggle,
    timerToggleGlobal,
    timerGet,
    timerGetGlobal,
    timerGetInactive,
    timerGetInactiveGlobal,
    timerEnd,
    timerEndGlobal,
    timers,

    subscriptionCreateCheckoutSession,
    subscriptionCreatePortalSession,
    subscriptionCancel,
    subscriptionGet,
    subscriptionWebhook,
};
