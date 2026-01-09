import type { UserRecord } from "@issue/shared";
import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Loading from "@/components/loading";
import { clearAuth, getServerURL, setCsrfToken } from "@/lib/utils";

export function Auth({ children }: { children: React.ReactNode }) {
    const [loggedIn, setLoggedIn] = useState<boolean>();
    const fetched = useRef(false);
    const location = useLocation();

    useEffect(() => {
        if (fetched.current) return;
        fetched.current = true;

        fetch(`${getServerURL()}/auth/me`, {
            credentials: "include",
        })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error(`auth check failed: ${res.status}`);
                }
                const data = (await res.json()) as { user: UserRecord; csrfToken: string };
                setLoggedIn(true);
                setCsrfToken(data.csrfToken);
                localStorage.setItem("user", JSON.stringify(data.user));
            })
            .catch(() => {
                setLoggedIn(false);
                clearAuth();
            });
    }, []);

    if (loggedIn) {
        return <>{children}</>;
    }

    if (loggedIn === false) {
        const next = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?next=${next}`} replace />;
    }

    return <Loading message={"Checking authentication"} />;
}
