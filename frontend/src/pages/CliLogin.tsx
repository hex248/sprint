import { type FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCsrfToken, getServerURL } from "@/lib/utils";

const formatCode = (value: string) => {
  const normalized = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  if (normalized.length <= 4) return normalized;
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
};

export default function CliLogin() {
  const { user, isLoading } = useSession();
  const [userCode, setUserCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => formatCode(userCode).length === 9, [userCode]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`${getServerURL()}/cli/login/approve`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken() ?? "",
        },
        body: JSON.stringify({ userCode: formatCode(userCode) }),
      });

      if (!response.ok) {
        let responseError = `Request failed (${response.status})`;
        try {
          const body = (await response.json()) as { error?: string };
          if (body.error) responseError = body.error;
        } catch {
          // no-op
        }
        setError(responseError);
        return;
      }

      setMessage("Code approved. You can return to your terminal.");
      setUserCode("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh px-4 py-12">
      <div className="mx-auto w-full max-w-xl border bg-card p-6">
        <h1 className="text-2xl font-basteleur">Approve CLI Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the user code shown in your terminal to approve device login.
        </p>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Checking your session...</p>
        ) : !user ? (
          <p className="mt-6 text-sm">
            You need to sign in first. Visit{" "}
            <Link className="underline" to="/">
              home
            </Link>{" "}
            and sign in, then come back to this page.
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block text-sm font-medium" htmlFor="cli-user-code">
              User code
            </label>
            <Input
              id="cli-user-code"
              value={formatCode(userCode)}
              onChange={(event) => setUserCode(event.target.value)}
              placeholder="ABCD-1234"
              maxLength={9}
              autoComplete="off"
              showCounter={false}
              inputClassName="font-mono uppercase"
            />
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Approving..." : "Approve"}
            </Button>

            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </form>
        )}
      </div>
    </main>
  );
}
