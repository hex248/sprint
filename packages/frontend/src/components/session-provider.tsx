import type { UserRecord } from "@sprint/shared";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Loading from "@/components/loading";
import { clearAuth, getServerURL, setCsrfToken } from "@/lib/utils";

interface SessionContextValue {
    user: UserRecord | null;
    setUser: (user: UserRecord) => void;
    isLoading: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// for use outside RequireAuth
export function useSession(): SessionContextValue {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return context;
}

// for use inside RequireAuth
export function useAuthenticatedSession(): { user: UserRecord; setUser: (user: UserRecord) => void } {
    const { user, setUser } = useSession();
    if (!user) {
        throw new Error("useAuthenticatedSession must be used within RequireAuth");
    }
    return { user, setUser };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [user, setUserState] = useState<UserRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const fetched = useRef(false);

    const setUser = useCallback((user: UserRecord) => {
        setUserState(user);
        localStorage.setItem("user", JSON.stringify(user));
    }, []);

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
                setUser(data.user);
                setCsrfToken(data.csrfToken);
            })
            .catch(() => {
                setUserState(null);
                clearAuth();
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [setUser]);

    return <SessionContext.Provider value={{ user, setUser, isLoading }}>{children}</SessionContext.Provider>;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useSession();
    const location = useLocation();

    if (isLoading) {
        return <Loading message={"Checking authentication"} />;
    }

    if (!user) {
        const next = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?next=${next}`} replace />;
    }

    return <>{children}</>;
}
