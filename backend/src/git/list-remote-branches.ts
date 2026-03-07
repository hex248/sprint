const GIT_REMOTE_BRANCH_LIST_TIMEOUT_MS = 10_000;
const MAX_REASON_LENGTH = 300;
const BRANCH_REF_PREFIX = "refs/heads/";

type ListRemoteBranchesResult = { ok: true; branches: string[] } | { ok: false; reason: string };

function truncateReason(reason: string) {
    if (reason.length <= MAX_REASON_LENGTH) return reason;
    return `${reason.slice(0, MAX_REASON_LENGTH)}...`;
}

function parseBranchNames(stdout: string) {
    const branches = new Set<string>();

    for (const line of stdout.split(/\r?\n/)) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            continue;
        }

        const [, ref] = trimmedLine.split(/\s+/, 2);
        if (!ref || !ref.startsWith(BRANCH_REF_PREFIX)) {
            continue;
        }

        const branchName = ref.slice(BRANCH_REF_PREFIX.length).trim();
        if (!branchName) {
            continue;
        }

        branches.add(branchName);
    }

    return [...branches].sort((a, b) => a.localeCompare(b));
}

export async function listRemoteBranches(remote: string): Promise<ListRemoteBranchesResult> {
    const trimmedRemote = remote.trim();
    if (!trimmedRemote) {
        return { ok: false, reason: "git remote cannot be empty" };
    }

    try {
        const subprocess = Bun.spawn({
            cmd: ["git", "ls-remote", "--heads", "--", trimmedRemote],
            stdout: "pipe",
            stderr: "pipe",
            env: {
                ...process.env,
                GIT_TERMINAL_PROMPT: "0",
            },
        });

        let timedOut = false;
        const timeout = setTimeout(() => {
            timedOut = true;
            subprocess.kill("SIGKILL");
        }, GIT_REMOTE_BRANCH_LIST_TIMEOUT_MS);

        const [stdout, stderr, exitCode] = await Promise.all([
            new Response(subprocess.stdout).text(),
            new Response(subprocess.stderr).text(),
            subprocess.exited,
        ]);

        clearTimeout(timeout);

        if (timedOut) {
            return {
                ok: false,
                reason: `git branch fetch timed out after ${GIT_REMOTE_BRANCH_LIST_TIMEOUT_MS / 1000} seconds`,
            };
        }

        if (exitCode !== 0) {
            const reason = truncateReason(
                (stderr.trim() || stdout.trim() || "git ls-remote failed").replace(/\s+/g, " "),
            );
            return { ok: false, reason };
        }

        const branches = parseBranchNames(stdout);

        return { ok: true, branches };
    } catch (error) {
        const reason = error instanceof Error ? error.message : "failed to fetch git branches";
        return { ok: false, reason: truncateReason(reason) };
    }
}
