import type { CliConfig } from "../lib/config";
import { resolveIssueByRef } from "../lib/context";
import { createBranch, getCurrentBranch } from "../lib/git";

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 48);

export const runBranchCommand = async (config: CliConfig, issueRefInput?: string, baseBranchArg?: string) => {
    if (!issueRefInput) {
        throw new Error("Usage: sprint branch <project-key-issue-number> [base-branch]");
    }

    const { project, issue } = await resolveIssueByRef(config, issueRefInput);
    const issueName = `${project.Project.key}-${issue.Issue.number}`;
    const branchName = `${issueName.toLowerCase()}-${slugify(issue.Issue.title)}`;
    const baseBranch = baseBranchArg || getCurrentBranch();

    createBranch(branchName, baseBranch);
    console.log(`Created branch: ${branchName} (base: ${baseBranch})`);
};
