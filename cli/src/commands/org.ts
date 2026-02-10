import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { getOrganisations } from "../lib/api";
import type { CliConfig } from "../lib/config";
import { saveConfig } from "../lib/config";

const promptOrgChoice = async (items: Array<{ slug: string; name: string }>) => {
    const rl = createInterface({ input: stdin, output: stdout });

    try {
        const answer = await rl.question("Select org number: ");
        const index = Number.parseInt(answer, 10);
        if (Number.isNaN(index) || index < 1 || index > items.length) {
            throw new Error("Invalid selection.");
        }

        return items[index - 1];
    } finally {
        rl.close();
    }
};

export const runOrgCommand = async (config: CliConfig, slug?: string) => {
    const organisations = await getOrganisations(config);
    if (organisations.length === 0) {
        throw new Error("No organisations found.");
    }

    const options = organisations.map((entry) => ({
        slug: entry.Organisation.slug,
        name: entry.Organisation.name,
    }));

    const selected = slug
        ? options.find((entry) => entry.slug.toLowerCase() === slug.toLowerCase())
        : await (async () => {
              console.log("Organisations:");
              options.forEach((entry, index) => {
                  console.log(`${index + 1}. ${entry.slug}  ${entry.name}`);
              });
              return promptOrgChoice(options);
          })();

    if (!selected) {
        throw new Error(`Organisation not found: ${slug}`);
    }

    config.currentOrgSlug = selected.slug;
    config.currentProjectKey = undefined;
    await saveConfig(config);

    console.log(`Selected org: ${selected.name} (${selected.slug})`);
};
