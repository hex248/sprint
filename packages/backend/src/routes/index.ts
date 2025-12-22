import authLogin from "./auth/login";
import authMe from "./auth/me";
import authRegister from "./auth/register";
import issueCreate from "./issue/create";
import issueDelete from "./issue/delete";
import issueUpdate from "./issue/update";
import issuesInProject from "./issues/[projectBlob]";
import issues from "./issues/all";
import projectsAll from "./project/all";
import projectsByOwner from "./project/by-owner";
import projectCreate from "./project/create";
import projectDelete from "./project/delete";
import projectUpdate from "./project/update";
import projectWithOwner from "./project/with-owner";
import projectsWithOwners from "./project/with-owners";

export const routes = {
    issueCreate,
    issueDelete,
    issueUpdate,

    issuesInProject,
    issues,

    projectCreate,
    projectUpdate,
    projectDelete,
    projectsByOwner,
    projectsAll,
    projectsWithOwners,
    projectWithOwner,

    authRegister,
    authLogin,
    authMe,
};
