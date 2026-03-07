import { ProjectBranchesQuerySchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getOrganisationMemberRole, getProjectByID } from "../../db/queries";
import { listRemoteBranches } from "../../git/list-remote-branches";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function projectBranches(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, ProjectBranchesQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { projectId } = parsed.data;

    const project = await getProjectByID(projectId);
    if (!project) {
        return errorResponse(`project not found: ${projectId}`, "PROJECT_NOT_FOUND", 404);
    }

    const membership = await getOrganisationMemberRole(project.organisationId, req.userId);
    if (!membership) {
        return errorResponse("not a member of this organisation", "NOT_MEMBER", 403);
    }

    const gitRemote = project.gitRemote?.trim();
    if (!gitRemote) {
        return errorResponse("git remote is not set for this project", "GIT_REMOTE_NOT_SET", 400);
    }

    const branchResult = await listRemoteBranches(gitRemote);
    if (!branchResult.ok) {
        return errorResponse(
            `failed to fetch git branches: ${branchResult.reason}`,
            "GIT_REMOTE_FETCH_FAILED",
            400,
        );
    }

    return Response.json({
        projectId: project.id,
        branches: branchResult.branches,
    });
}
