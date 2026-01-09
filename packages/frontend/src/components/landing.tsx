import type { UserRecord } from "@issue/shared";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { clearAuth, getServerURL, setCsrfToken } from "@/lib/utils";

type AuthState = "unknown" | "authenticated" | "unauthenticated";

export default function Landing() {
    const [authState, setAuthState] = useState<AuthState>("unknown");
    const verifiedRef = useRef(false);

    useEffect(() => {
        if (verifiedRef.current) return;
        verifiedRef.current = true;

        fetch(`${getServerURL()}/auth/me`, {
            credentials: "include",
        })
            .then(async (res) => {
                if (res.ok) {
                    const data = (await res.json()) as { user: UserRecord; csrfToken: string };
                    localStorage.setItem("user", JSON.stringify(data.user));
                    setCsrfToken(data.csrfToken);
                    setAuthState("authenticated");
                } else {
                    clearAuth();
                    setAuthState("unauthenticated");
                }
            })
            .catch(() => {
                clearAuth();
                setAuthState("unauthenticated");
            });
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <header className="relative flex items-center justify-center p-2 border-b">
                <div className="text-3xl font-basteleur font-700">Issue</div>
                <nav className="absolute right-2 flex items-center gap-4">
                    {authState === "authenticated" ? (
                        <Button asChild variant="outline" size="sm">
                            <Link to="/app">Open app</Link>
                        </Button>
                    ) : (
                        <Button asChild variant="outline" size="sm">
                            <Link to="/login">Sign in</Link>
                        </Button>
                    )}
                </nav>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center gap-8">
                <div className="max-w-3xl text-center space-y-4">
                    <h1 className="text-[54px] font-basteleur font-700">
                        Need a snappy project management tool?
                    </h1>
                    <p className="text-[24px] font-goudy text-muted-foreground">
                        Build your next project with <span className="font-goudy font-700">Issue.</span>
                    </p>
                    <p className="text-[18px] font-goudy text-muted-foreground">
                        Sick of Jira? Say hello to your new favorite project management tool.
                    </p>
                </div>

                <div className="flex gap-4">
                    {authState === "authenticated" ? (
                        <Button asChild size="lg">
                            <Link to="/app">Open app</Link>
                        </Button>
                    ) : (
                        <Button asChild size="lg">
                            <Link to="/login">Get started</Link>
                        </Button>
                    )}
                </div>
            </main>

            <footer className="flex justify-center gap-2 items-center py-2 border-t">
                <span className="font-300 text-sm text-muted-foreground">
                    Built by{" "}
                    <a
                        href="https://ob248.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-personality"
                    >
                        Oliver Bryan
                    </a>
                </span>
                <a href="https://ob248.com" target="_blank" rel="noopener noreferrer">
                    <img src="oliver-bryan.svg" alt="Oliver Bryan" className="w-3 h-3" />
                </a>
            </footer>
        </div>
    );
}
