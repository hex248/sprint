import authLogin from "./auth/login";
import authLogout from "./auth/logout";
import authMe from "./auth/me";
import authRegister from "./auth/register";
import issueCreate from "./issue/create";
import issueDelete from "./issue/delete";
import issueUpdate from "./issue/update";
import issues from "./issues/all";
import issuesByProject from "./issues/by-project";
import issuesReplaceStatus from "./issues/replace-status";
import issuesStatusCount from "./issues/status-count";
import organisationAddMember from "./organisation/add-member";
import organisationById from "./organisation/by-id";
import organisationsByUser from "./organisation/by-user";
import organisationCreate from "./organisation/create";
import organisationDelete from "./organisation/delete";
import organisationMembers from "./organisation/members";
import organisationRemoveMember from "./organisation/remove-member";
import organisationUpdate from "./organisation/update";
import organisationUpdateMemberRole from "./organisation/update-member-role";
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

    userByUsername,
    userUpdate,
    userUploadAvatar,

    issueCreate,
    issueDelete,
    issueUpdate,

    issuesByProject,
    issues,
    issuesReplaceStatus,
    issuesStatusCount,

    organisationCreate,
    organisationById,
    organisationUpdate,
    organisationDelete,
    organisationAddMember,
    organisationMembers,
    organisationRemoveMember,
    organisationUpdateMemberRole,

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
};
