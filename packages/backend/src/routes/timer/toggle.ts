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
    getActiveTimedSession,
    getIssueAssigneeCount,
} from "../../db/queries";
import { parseJsonBody } from "../../validation";

export default async function timerToggle(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, TimerToggleRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { issueId } = parsed.data;

    const assigneeCount = await getIssueAssigneeCount(issueId);
    if (assigneeCount > 1) {
        return Response.json(
            { error: "Timers cannot be used on issues with multiple assignees", code: "MULTIPLE_ASSIGNEES" },
            { status: 400 },
        );
    }

    const activeSession = await getActiveTimedSession(req.userId, issueId);

    if (!activeSession) {
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
