import type { CliConfig } from "../lib/config";
import { resolveIssueByRef } from "../lib/context";
import { issueRefToString } from "../lib/issue-ref";
import { printKeyValue } from "../lib/output";

export const runShowCommand = async (config: CliConfig, issueRefInput?: string, asJson = false) => {
    if (!issueRefInput) {
        throw new Error("Usage: sprint show <project-key-issue-number> [--json]");
    }

    const { project, issue } = await resolveIssueByRef(config, issueRefInput);

    if (asJson) {
        console.log(JSON.stringify(issue, null, 2));
        return;
    }

    printKeyValue([
        ["issue", issueRefToString(project.Project.key, issue.Issue.number)],
        ["title", issue.Issue.title],
        ["status", issue.Issue.status],
        ["type", issue.Issue.type],
        ["sprint", issue.Issue.sprintId],
        ["creator", issue.Creator.username],
        ["assignees", issue.Assignees.map((entry: { username: string }) => entry.username).join(", ") || "-"],
    ]);

    console.log();
    console.log(issue.Issue.description || "(no description)");
};
