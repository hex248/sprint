import { pollCliLogin, startCliLogin } from "../lib/api";
import type { CliConfig } from "../lib/config";
import { getConfigPath, saveConfig } from "../lib/config";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getVerificationUrl = (backendUrl: string) => {
    const override = process.env.SPRINT_CLI_AUTH_URL?.trim();
    if (!override) return backendUrl;

    const parsed = new URL(override);
    if (parsed.pathname === "/" || parsed.pathname === "") {
        parsed.pathname = "/cli/login";
    }
    return parsed.toString();
};

export const runLoginCommand = async (config: CliConfig) => {
    const started = await startCliLogin(config);

    console.log("Open this URL in your browser:");
    console.log(getVerificationUrl(started.verificationUri));
    console.log();
    console.log("Enter this code:");
    console.log(started.userCode);
    console.log();
    console.log("Waiting for approval...");

    let intervalSeconds = started.intervalSeconds;
    const expiresAt = Date.now() + started.expiresInSeconds * 1000;

    while (Date.now() < expiresAt) {
        await sleep(Math.max(1, intervalSeconds) * 1000);

        const poll = await pollCliLogin(config, started.deviceCode);
        if (poll.status === "pending") {
            intervalSeconds = poll.intervalSeconds;
            continue;
        }

        if (poll.status === "approved") {
            config.token = poll.token;
            config.csrfToken = poll.csrfToken;
            await saveConfig(config);
            console.log(`Login complete. Credentials stored in ${getConfigPath()}`);
            return;
        }

        if (poll.status === "denied") {
            throw new Error("Login request was denied.");
        }

        if (poll.status === "expired") {
            throw new Error("Login request expired. Run `sprint login` again.");
        }
    }

    throw new Error("Login timed out. Run `sprint login` again.");
};
