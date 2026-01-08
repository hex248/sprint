import type { UserRecord } from "@issue/shared";
import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Loading from "@/components/loading";
import LogInForm from "@/components/login-form";
import { getServerURL } from "@/lib/utils";

type AuthProviderProps = {
    children: React.ReactNode;
    loggedInDefault?: boolean;
};

export function Auth({ children }: AuthProviderProps) {
    const [loggedIn, setLoggedIn] = useState<boolean>();
    const fetched = useRef(false);

    useEffect(() => {
        if (fetched.current) return;
        fetched.current = true;
        const token = localStorage.getItem("token");
        if (!token) {
            return setLoggedIn(false);
        }
        fetch(`${getServerURL()}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error(`auth check failed: ${res.status}`);
                }
                return (await res.json()) as UserRecord;
            })
            .then((data) => {
                setLoggedIn(true);
                localStorage.setItem("user", JSON.stringify(data));
            })
            .catch(() => {
                setLoggedIn(false);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("selectedOrganisationId");
                localStorage.removeItem("selectedProjectId");
            });
    }, []);

    if (loggedIn) {
        return <>{children}</>;
    }
    if (loggedIn === false)
        return (
            <div className="flex flex-col items-center justify-center gap-4 w-full h-[100vh]">
                {/* under construction warning */}
                <div className="flex flex-col border p-4 items-center border-border/50 bg-border/10 gap-2 max-w-lg">
                    <AlertTriangle className="w-16 h-16 text-yellow-500" strokeWidth={1.5} />
                    <p className="text-center text-sm text-muted-foreground font-500">
                        This application is currently under construction. Your data is very likely to be lost
                        at some point.
                        <pre> </pre>
                        <p className="font-700 underline underline-offset-3 text-foreground/85 decoration-yellow-500">
                            It is not recommended for production use.
                        </p>
                        But you're more than welcome to have a look around!
                    </p>
                </div>
                <LogInForm />
            </div>
        );

    return <Loading message={"Understanding your authentication state"} />;
}
