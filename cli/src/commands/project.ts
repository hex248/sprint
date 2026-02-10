import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { getProjectsByOrganisation } from "../lib/api";
import type { CliConfig } from "../lib/config";
import { saveConfig } from "../lib/config";
import { resolveOrganisation } from "../lib/context";

const promptProjectChoice = async (items: Array<{ key: string; name: string }>) => {
    const rl = createInterface({ input: stdin, output: stdout });

    try {
        const answer = await rl.question("Select project number: ");
        const index = Number.parseInt(answer, 10);
        if (Number.isNaN(index) || index < 1 || index > items.length) {
            throw new Error("Invalid selection.");
        }

        return items[index - 1];
    } finally {
        rl.close();
    }
};

export const runProjectCommand = async (config: CliConfig, key?: string) => {
    const organisation = await resolveOrganisation(config);
    const projects = await getProjectsByOrganisation(config, organisation.Organisation.id);

    if (projects.length === 0) {
        throw new Error("No projects found for selected org.");
    }

    const options = projects.map((entry) => ({ key: entry.Project.key, name: entry.Project.name }));

    const selected = key
        ? options.find((entry) => entry.key.toUpperCase() === key.toUpperCase())
        : await (async () => {
              console.log(`Projects in ${organisation.Organisation.slug}:`);
              options.forEach((entry, index) => {
                  console.log(`${index + 1}. ${entry.key}  ${entry.name}`);
              });
              return promptProjectChoice(options);
          })();

    if (!selected) {
        throw new Error(`Project not found: ${key}`);
    }

    config.currentProjectKey = selected.key;
    await saveConfig(config);
    console.log(`Selected project: ${selected.key} (${selected.name})`);
};
