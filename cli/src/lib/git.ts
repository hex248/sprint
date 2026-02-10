import { spawnSync } from "node:child_process";

const runGit = (args: string[]) => {
    const result = spawnSync("git", args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
    });

    if (result.status !== 0) {
        const stderr = (result.stderr ?? "").trim();
        const stdout = (result.stdout ?? "").trim();
        throw new Error(stderr || stdout || `git ${args.join(" ")} failed`);
    }

    return (result.stdout ?? "").trim();
};

export const getCurrentBranch = () => runGit(["rev-parse", "--abbrev-ref", "HEAD"]);

export const createBranch = (branchName: string, baseBranch?: string) => {
    if (baseBranch) {
        runGit(["checkout", "-b", branchName, baseBranch]);
        return;
    }

    runGit(["checkout", "-b", branchName]);
};
