import issueCreate from "./issue/create";
import issueDelete from "./issue/delete";
import issueUpdate from "./issue/update";
import issuesInProject from "./issues/[projectBlob]";
import issues from "./issues/all";

import projectCreate from "./project/create";
import projectUpdate from "./project/update";
import projectDelete from "./project/delete";

export const routes = {
    issueCreate,
    issueDelete,
    issueUpdate,

    issuesInProject,
    issues,

    projectCreate,
    projectUpdate,
    projectDelete,
};
