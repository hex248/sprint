import type { UserRecord } from "@issue/shared";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loading from "@/components/loading";
import LogInForm from "@/components/login-form";
import { clearAuth, getServerURL, setCsrfToken } from "@/lib/utils";

export default function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [checking, setChecking] = useState(true);
    const checkedRef = useRef(false);

    useEffect(() => {
        if (checkedRef.current) return;
        checkedRef.current = true;

        fetch(`${getServerURL()}/auth/me`, {
            credentials: "include",
        })
            .then(async (res) => {
                if (res.ok) {
                    const data = (await res.json()) as { user: UserRecord; csrfToken: string };
                    setCsrfToken(data.csrfToken);
                    localStorage.setItem("user", JSON.stringify(data.user));
                    const next = searchParams.get("next") || "/app";
                    navigate(next, { replace: true });
                } else {
                    clearAuth();
                    setChecking(false);
                }
            })
            .catch(() => {
                setChecking(false);
            });
    }, [navigate, searchParams]);

    if (checking) {
        return <Loading message="Checking authentication" />;
    }

    return (
        <div className="flex flex-col items-center justify-center gap-4 w-full h-[100vh]">
            <LogInForm />
        </div>
    );
}
