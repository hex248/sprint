import type { UserRecord } from "@issue/shared";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getServerURL } from "@/lib/utils";

type AuthState = "unknown" | "authenticated" | "unauthenticated";

export default function Landing() {
    const [authState, setAuthState] = useState<AuthState>(() => {
        // if token exists, assume authenticated until verified
        return localStorage.getItem("token") ? "unknown" : "unauthenticated";
    });
    const verifiedRef = useRef(false);

    useEffect(() => {
        if (verifiedRef.current) return;
        verifiedRef.current = true;

        const token = localStorage.getItem("token");
        if (!token) {
            setAuthState("unauthenticated");
            return;
        }

        // verify token in background
        fetch(`${getServerURL()}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (res) => {
                if (res.ok) {
                    const user = (await res.json()) as UserRecord;
                    localStorage.setItem("user", JSON.stringify(user));
                    setAuthState("authenticated");
                } else {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    setAuthState("unauthenticated");
                }
            })
            .catch(() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setAuthState("unauthenticated");
            });
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <header className="flex items-center justify-between p-2 border-b">
                <div className="text-lg font-semibold">Issue</div>
                <nav className="flex items-center gap-4">
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
                <div className="max-w-2xl text-center space-y-4">
                    <h1 className="text-4xl font-600">
                        Does your team need a snappy project management tool?
                    </h1>
                    <p className="text-md text-muted-foreground font-500">
                        Build your next project with <span className="font-700">Issue</span>.
                    </p>
                    <p className="text-md text-muted-foreground font-400">
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

            <footer className="p-2 border-t text-center text-sm font-300 text-muted-foreground">
                Built by{" "}
                <a
                    href="https://ob248.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline underline-offset-2"
                >
                    Oliver Bryan
                </a>
            </footer>
        </div>
    );
}
