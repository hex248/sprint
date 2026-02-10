import type { IssueResponse } from "@sprint/shared";
import type { CliConfig } from "../lib/config";
import { getProjectIssues } from "../lib/context";
import { issueRefToString } from "../lib/issue-ref";
import { printTable } from "../lib/output";

type ListOptions = {
    status?: string;
    type?: string;
    assignee?: string;
    sprint?: string;
    sort?: string;
    json?: boolean;
};

const parseListFlags = (args: string[]): ListOptions => {
    const options: ListOptions = {};

    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (!arg) continue;

        if (arg === "-s") {
            throw new Error("`-s` is ambiguous for list. Use `--status` or `--sprint`.");
        }

        if (arg === "--json") {
            options.json = true;
            continue;
        }

        const next = args[i + 1];
        if (!next) {
            throw new Error(`Missing value for ${arg}`);
        }

        if (arg === "--status") {
            options.status = next;
            i += 1;
            continue;
        }

        if (arg === "--type" || arg === "-t") {
            options.type = next;
            i += 1;
            continue;
        }

        if (arg === "--assignee" || arg === "-a") {
            options.assignee = next;
            i += 1;
            continue;
        }

        if (arg === "--sprint") {
            options.sprint = next;
            i += 1;
            continue;
        }

        if (arg === "--sort") {
            options.sort = next;
            i += 1;
            continue;
        }

        throw new Error(`Unknown option: ${arg}`);
    }

    return options;
};

const normalize = (value: string) => value.trim().toLowerCase();

const applyFilters = (issues: IssueResponse[], options: ListOptions) => {
    let result = issues;

    if (options.status) {
        const expected = normalize(options.status);
        result = result.filter((entry) => normalize(entry.Issue.status) === expected);
    }

    if (options.type) {
        const expected = normalize(options.type);
        result = result.filter((entry) => normalize(entry.Issue.type) === expected);
    }

    if (options.assignee) {
        const expected = normalize(options.assignee);
        result = result.filter((entry) =>
            entry.Assignees.some(
                (assignee: { username: string }) => normalize(assignee.username) === expected,
            ),
        );
    }

    if (options.sprint) {
        const expected = normalize(options.sprint);
        result = result.filter((entry) => {
            if (expected === "none") return entry.Issue.sprintId == null;
            return String(entry.Issue.sprintId ?? "").toLowerCase() === expected;
        });
    }

    const sortField = options.sort ?? "number";
    result = result.toSorted((left, right) => {
        if (sortField === "number") return left.Issue.number - right.Issue.number;
        if (sortField === "status") return left.Issue.status.localeCompare(right.Issue.status);
        if (sortField === "type") return left.Issue.type.localeCompare(right.Issue.type);
        if (sortField === "title") return left.Issue.title.localeCompare(right.Issue.title);
        return 0;
    });

    return result;
};

export const runListCommand = async (config: CliConfig, args: string[]) => {
    const options = parseListFlags(args);
    const { project, issues } = await getProjectIssues(config);
    const filtered = applyFilters(issues, options);

    if (options.json) {
        console.log(JSON.stringify(filtered, null, 2));
        return;
    }

    if (filtered.length === 0) {
        console.log("No issues found.");
        return;
    }

    printTable(
        ["Issue", "Status", "Type", "Assignees", "Title"],
        filtered.map((entry) => [
            issueRefToString(project.Project.key, entry.Issue.number),
            entry.Issue.status,
            entry.Issue.type,
            entry.Assignees.map((assignee: { username: string }) => assignee.username).join(", ") || "-",
            entry.Issue.title,
        ]),
    );
};
