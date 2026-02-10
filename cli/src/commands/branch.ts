import type { CliConfig } from "../lib/config";
import { resolveIssueByRef } from "../lib/context";
import { createBranch, getCurrentBranch } from "../lib/git";

const slugifyLower = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

const slugifyPreserveCase = (value: string) =>
    value
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

export const runBranchCommand = async (config: CliConfig, issueRefInput?: string, baseBranchArg?: string) => {
    if (!issueRefInput) {
        throw new Error("Usage: sprint branch <project-key-issue-number> [base-branch]");
    }

    const { project, issue } = await resolveIssueByRef(config, issueRefInput);
    const issueTag = `${project.Project.key}-${issue.Issue.number}`;
    const type = slugifyLower(issue.Issue.type) || "task";
    const assignee = issue.Assignees[0]?.username ?? "unassigned";
    const title = slugifyPreserveCase(issue.Issue.title) || "untitled";
    const branchName = `${type}/${assignee}/${issueTag}/${title}`;
    const baseBranch = baseBranchArg || getCurrentBranch();

    createBranch(branchName, baseBranch);
    console.log(`Created branch: ${branchName} (base: ${baseBranch})`);
};
