const GIT_REMOTE_VALIDATION_TIMEOUT_MS = 10_000;
const MAX_VALIDATION_REASON_LENGTH = 300;

type GitRemoteValidationResult = { ok: true } | { ok: false; reason: string };

function truncateReason(reason: string) {
    if (reason.length <= MAX_VALIDATION_REASON_LENGTH) return reason;
    return `${reason.slice(0, MAX_VALIDATION_REASON_LENGTH)}...`;
}

export async function validateGitRemote(remote: string): Promise<GitRemoteValidationResult> {
    const trimmedRemote = remote.trim();
    if (!trimmedRemote) {
        return { ok: false, reason: "git remote cannot be empty" };
    }

    try {
        const subprocess = Bun.spawn({
            cmd: ["git", "ls-remote", "--heads", "--tags", "--", trimmedRemote],
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
        }, GIT_REMOTE_VALIDATION_TIMEOUT_MS);

        const [stdout, stderr, exitCode] = await Promise.all([
            new Response(subprocess.stdout).text(),
            new Response(subprocess.stderr).text(),
            subprocess.exited,
        ]);

        clearTimeout(timeout);

        if (timedOut) {
            return {
                ok: false,
                reason: `git remote validation timed out after ${GIT_REMOTE_VALIDATION_TIMEOUT_MS / 1000} seconds`,
            };
        }

        if (exitCode !== 0) {
            const reason = truncateReason(
                (stderr.trim() || stdout.trim() || "git ls-remote failed").replace(/\s+/g, " "),
            );
            return { ok: false, reason };
        }

        return { ok: true };
    } catch (error) {
        const reason = error instanceof Error ? error.message : "failed to run git remote validation";
        return { ok: false, reason: truncateReason(reason) };
    }
}
