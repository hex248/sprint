import type { UserRecord } from "@issue/shared";
import { useEffect, useRef, useState } from "react";
import Loading from "@/components/loading";
import LogInForm from "@/components/login-form";
import { getServerURL } from "@/lib/utils";

export function Auth({ children }: { children: React.ReactNode; loggedInDefault?: boolean }) {
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
                <LogInForm />
            </div>
        );

    return <Loading message={"Understanding your authentication state"} />;
}
