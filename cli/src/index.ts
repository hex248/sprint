#!/usr/bin/env bun

import { runBranchCommand } from "./commands/branch";
import { runCreateCommand } from "./commands/create";
import { runListCommand } from "./commands/list";
import { runLoginCommand } from "./commands/login";
import { runOrgCommand } from "./commands/org";
import { runProjectCommand } from "./commands/project";
import { runShowCommand } from "./commands/show";
import { loadConfig } from "./lib/config";
import { loadCliEnv } from "./lib/env";

loadCliEnv();

const helpText = `Sprint CLI

Commands:
  sprint login
  sprint org <org-slug>
  sprint project [project-key]
  sprint list [--status|--type|-t|--assignee|-a|--sprint|--sort|--json]
  sprint show <project-key-issue-number> [--json]
  sprint create <issue-name> <issue-description> [--status|-s] [--type|-t] [--assignee|-a] [--sprint]
  sprint branch <project-key-issue-number> [base-branch]
`;

const main = async () => {
    const [, , command, ...args] = Bun.argv;

    if (!command || command === "--help" || command === "-h" || command === "help") {
        console.log(helpText);
        return;
    }

    const config = await loadConfig();

    if (command === "login") {
        await runLoginCommand(config);
        return;
    }

    if (command === "org") {
        await runOrgCommand(config, args[0]);
        return;
    }

    if (command === "project") {
        await runProjectCommand(config, args[0]);
        return;
    }

    if (command === "list") {
        await runListCommand(config, args);
        return;
    }

    if (command === "show") {
        const asJson = args.includes("--json");
        const issueRef = args.find((arg: string) => arg !== "--json");
        await runShowCommand(config, issueRef, asJson);
        return;
    }

    if (command === "create") {
        await runCreateCommand(config, args);
        return;
    }

    if (command === "branch") {
        await runBranchCommand(config, args[0], args[1]);
        return;
    }

    throw new Error(`Unknown command: ${command}`);
};

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
});
