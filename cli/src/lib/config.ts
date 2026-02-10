import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type CliConfig = {
    apiBaseUrl: string;
    token?: string;
    csrfToken?: string;
    sessionExpiresAt?: string;
    currentOrgSlug?: string;
    currentProjectKey?: string;
};

const CONFIG_FILE_PATH =
    process.env.SPRINT_CLI_CONFIG_PATH || join(homedir(), ".config", "sprint-cli", "config.json");

const getDefaultApiUrl = () => process.env.SPRINT_API_URL?.trim() || "https://server.sprintpm.org";

const normalizeApiUrl = (url: string) => {
    if (!url) return getDefaultApiUrl();
    return url.endsWith("/") ? url.slice(0, -1) : url;
};

export const getConfigPath = () => CONFIG_FILE_PATH;

export const getDefaultConfig = (): CliConfig => ({
    apiBaseUrl: normalizeApiUrl(getDefaultApiUrl()),
});

export const loadConfig = async (): Promise<CliConfig> => {
    const envApiUrl = process.env.SPRINT_API_URL?.trim();

    try {
        const raw = await readFile(CONFIG_FILE_PATH, "utf8");
        const parsed = JSON.parse(raw) as Partial<CliConfig>;
        return {
            ...getDefaultConfig(),
            ...parsed,
            apiBaseUrl: normalizeApiUrl(envApiUrl || parsed.apiBaseUrl || getDefaultApiUrl()),
        };
    } catch {
        return getDefaultConfig();
    }
};

export const saveConfig = async (config: CliConfig) => {
    const targetDir = dirname(CONFIG_FILE_PATH);
    await mkdir(targetDir, { recursive: true, mode: 0o700 });
    await chmod(targetDir, 0o700).catch(() => {});

    const data = JSON.stringify(
        {
            ...config,
            apiBaseUrl: normalizeApiUrl(config.apiBaseUrl),
        },
        null,
        2,
    );

    await writeFile(CONFIG_FILE_PATH, `${data}\n`, { mode: 0o600 });
    await chmod(CONFIG_FILE_PATH, 0o600).catch(() => {});
};
