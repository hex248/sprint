const runGit = (args: string[]) => {
    const result = Bun.spawnSync({
        cmd: ["git", ...args],
        stdout: "pipe",
        stderr: "pipe",
    });

    if (result.exitCode !== 0) {
        const stderr = new TextDecoder().decode(result.stderr).trim();
        const stdout = new TextDecoder().decode(result.stdout).trim();
        throw new Error(stderr || stdout || `git ${args.join(" ")} failed`);
    }

    return new TextDecoder().decode(result.stdout).trim();
};

export const getCurrentBranch = () => runGit(["rev-parse", "--abbrev-ref", "HEAD"]);

export const createBranch = (branchName: string, baseBranch?: string) => {
    if (baseBranch) {
        runGit(["checkout", "-b", branchName, baseBranch]);
        return;
    }

    runGit(["checkout", "-b", branchName]);
};
