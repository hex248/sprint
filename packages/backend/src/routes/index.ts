import authLogin from "./auth/login";
import authLogout from "./auth/logout";
import authMe from "./auth/me";
import authRegister from "./auth/register";
import authResendVerification from "./auth/resend-verification";
import authVerifyEmail from "./auth/verify-email";
import issueById from "./issue/by-id";
import issueCreate from "./issue/create";
import issueDelete from "./issue/delete";
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
import timerGet from "./timer/get";
import timerGetInactive from "./timer/get-inactive";
import timerToggle from "./timer/toggle";
import timers from "./timers";
import userByUsername from "./user/by-username";
import userUpdate from "./user/update";
import userUploadAvatar from "./user/upload-avatar";

export const routes = {
    authRegister,
    authLogin,
    authLogout,
    authMe,
    authVerifyEmail,
    authResendVerification,

    userByUsername,
    userUpdate,
    userUploadAvatar,

    issueCreate,
    issueById,
    issueDelete,
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
    sprintUpdate,
    sprintDelete,
    sprintsByProject,

    timerToggle,
    timerGet,
    timerGetInactive,
    timerEnd,
    timers,

    subscriptionCreateCheckoutSession,
    subscriptionCreatePortalSession,
    subscriptionCancel,
    subscriptionGet,
    subscriptionWebhook,
};
