import {
    calculateBreakTimeMs,
    calculateWorkTimeMs,
    isTimerRunning,
    TimerToggleRequestSchema,
} from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    appendTimestamp,
    createTimedSession,
    endActiveGlobalTimer,
    getActiveTimedSession,
    getIssueAssigneeCount,
    getIssueByID,
    getOrganisationMemberRole,
    getProjectByID,
    isIssueAssignee,
} from "../../db/queries";
import { parseJsonBody } from "../../validation";

export default async function timerToggle(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, TimerToggleRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { issueId } = parsed.data;

    const issue = await getIssueByID(issueId);
    if (!issue) {
        return Response.json(
            { error: `issue not found: ${issueId}`, code: "ISSUE_NOT_FOUND" },
            { status: 404 },
        );
    }

    const project = await getProjectByID(issue.projectId);
    if (!project) {
        return Response.json({ error: "project not found", code: "PROJECT_NOT_FOUND" }, { status: 404 });
    }

    const membership = await getOrganisationMemberRole(project.organisationId, req.userId);
    if (!membership) {
        return Response.json(
            { error: "you are not a member of this organisation", code: "NOT_MEMBER" },
            { status: 403 },
        );
    }

    const isAssigned = await isIssueAssignee(issueId, req.userId);
    if (!isAssigned) {
        return Response.json(
            { error: "you must be assigned to this issue", code: "NOT_ASSIGNEE" },
            { status: 403 },
        );
    }

    const assigneeCount = await getIssueAssigneeCount(issueId);
    if (assigneeCount > 1) {
        return Response.json(
            { error: "Timers cannot be used on issues with multiple assignees", code: "MULTIPLE_ASSIGNEES" },
            { status: 400 },
        );
    }

    const activeSession = await getActiveTimedSession(req.userId, issueId);

    if (!activeSession) {
        // end any active global timer before starting issue timer
        await endActiveGlobalTimer(req.userId);

        const newSession = await createTimedSession(req.userId, issueId);
        return Response.json({
            ...newSession,
            workTimeMs: 0,
            breakTimeMs: 0,
            isRunning: true,
        });
    }

    const updated = await appendTimestamp(activeSession.id, activeSession.timestamps);
    if (!updated) {
        return Response.json({ error: "failed to update timer", code: "UPDATE_FAILED" }, { status: 500 });
    }

    const running = isTimerRunning(updated.timestamps);

    return Response.json({
        ...updated,
        workTimeMs: calculateWorkTimeMs(updated.timestamps),
        breakTimeMs: calculateBreakTimeMs(updated.timestamps),
        isRunning: running,
    });
}
