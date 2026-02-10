import { createIssue, getOrganisationMembers } from "../lib/api";
import type { CliConfig } from "../lib/config";
import { resolveOrganisation, resolveProject } from "../lib/context";
import { issueRefToString } from "../lib/issue-ref";

type CreateOptions = {
    status: string;
    type: string;
    assignee?: string;
    sprintId?: number | null;
};

const parseCreateFlags = (args: string[]) => {
    const options: CreateOptions = {
        status: "TO DO",
        type: "Task",
    };

    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (!arg) continue;

        const next = args[i + 1];
        if (!next) throw new Error(`Missing value for ${arg}`);

        if (arg === "--status" || arg === "-s") {
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
            if (next.toLowerCase() === "none") {
                options.sprintId = null;
            } else {
                const sprintId = Number.parseInt(next, 10);
                if (Number.isNaN(sprintId)) {
                    throw new Error(`Invalid sprint value: ${next}`);
                }
                options.sprintId = sprintId;
            }
            i += 1;
            continue;
        }

        throw new Error(`Unknown option: ${arg}`);
    }

    return options;
};

export const runCreateCommand = async (config: CliConfig, args: string[]) => {
    if (args.length < 2) {
        throw new Error(
            "Usage: sprint create <issue-name> <issue-description> [--status|-s] [--type|-t] [--assignee|-a] [--sprint]",
        );
    }

    const title = args[0] as string;
    const description = args[1] as string;
    const flagArgs = args.slice(2);
    const options = parseCreateFlags(flagArgs);

    const organisation = await resolveOrganisation(config);
    const project = await resolveProject(config, organisation.Organisation.id);

    let assigneeIds: number[] | undefined;
    if (options.assignee) {
        const members = await getOrganisationMembers(config, organisation.Organisation.id);
        const match = members.find(
            (entry) => entry.User.username.toLowerCase() === options.assignee?.toLowerCase(),
        );
        if (!match) {
            throw new Error(`Assignee not found in selected org: ${options.assignee}`);
        }
        assigneeIds = [match.User.id];
    }

    const issue = await createIssue(config, {
        projectId: project.Project.id,
        title,
        description,
        status: options.status,
        type: options.type,
        assigneeIds,
        sprintId: options.sprintId,
    });

    console.log(`Created ${issueRefToString(project.Project.key, issue.number)}: ${issue.title}`);
};
