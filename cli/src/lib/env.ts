import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

export const loadCliEnv = () => {
    const srcDir = dirname(fileURLToPath(import.meta.url));
    const cliDir = resolve(srcDir, "..", "..");
    const envPath = resolve(cliDir, ".env");

    dotenv.config({ path: envPath, override: true, quiet: true });
};
