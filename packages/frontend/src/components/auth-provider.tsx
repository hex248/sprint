import type { UserRecord } from "@issue/shared";
import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Loading from "@/components/loading";
import { getServerURL } from "@/lib/utils";

export function Auth({ children }: { children: React.ReactNode }) {
    const [loggedIn, setLoggedIn] = useState<boolean>();
    const fetched = useRef(false);
    const location = useLocation();

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

    if (loggedIn === false) {
        const next = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?next=${next}`} replace />;
    }

    return <Loading message={"Checking authentication"} />;
}
