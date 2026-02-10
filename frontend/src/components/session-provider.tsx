import type { UserResponse } from "@sprint/shared";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { DataLoadingError } from "@/components/data-loading-error";
import Loading from "@/components/loading";
import { LoginModal } from "@/components/login-modal";
import { VerificationModal } from "@/components/verification-modal";
import { clearAuth, getServerURL, setCsrfToken } from "@/lib/utils";

interface SessionContextValue {
  user: UserResponse | null;
  setUser: (user: UserResponse) => void;
  isLoading: boolean;
  userDataError: boolean;
  emailVerified: boolean;
  setEmailVerified: (verified: boolean) => void;
  refreshUser: () => Promise<void>;
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

// safe version that returns null if outside provider
export function useSessionSafe(): SessionContextValue | null {
  return useContext(SessionContext);
}

// for use inside RequireAuth
export function useAuthenticatedSession(): { user: UserResponse; setUser: (user: UserResponse) => void } {
  const { user, setUser } = useSession();
  if (!user) {
    throw new Error("useAuthenticatedSession must be used within RequireAuth");
  }
  return { user, setUser };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userDataError, setUserDataError] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);
  const fetched = useRef(false);

  const setUser = useCallback((user: UserResponse) => {
    setUserState(user);
    localStorage.setItem("user", JSON.stringify(user));
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await fetch(`${getServerURL()}/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        setUserDataError(false);
        setUserState(null);
        clearAuth();
        return;
      }
      setUserDataError(true);
      throw new Error(`auth check failed: ${res.status}`);
    }
    const data = (await res.json()) as { user: UserResponse; csrfToken: string; emailVerified: boolean };
    setUser(data.user);
    setCsrfToken(data.csrfToken);
    setEmailVerified(data.emailVerified);
    setUserDataError(false);
  }, [setUser]);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch(`${getServerURL()}/auth/me`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setUserDataError(false);
            setUserState(null);
            clearAuth();
            return;
          }
          setUserDataError(true);
          throw new Error(`auth check failed: ${res.status}`);
        }
        const data = (await res.json()) as { user: UserResponse; csrfToken: string; emailVerified: boolean };
        setUser(data.user);
        setCsrfToken(data.csrfToken);
        setEmailVerified(data.emailVerified);
        setUserDataError(false);
      })
      .catch(() => {
        setUserDataError(true);
        setUserState(null);
        clearAuth();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [setUser]);

  return (
    <SessionContext.Provider
      value={{ user, setUser, isLoading, userDataError, emailVerified, setEmailVerified, refreshUser }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading, userDataError, emailVerified } = useSession();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setLoginModalOpen(true);
    } else if (user) {
      setLoginModalOpen(false);
    }
  }, [user, isLoading]);

  if (isLoading) {
    return <Loading message={"Checking authentication"} />;
  }

  if (userDataError) {
    return <DataLoadingError />;
  }

  if (!user) {
    return <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} dismissible={false} />;
  }

  if (user && !emailVerified) {
    return <VerificationModal open={true} onOpenChange={() => {}} />;
  }

  return <>{children}</>;
}
