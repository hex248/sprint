import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loading from "@/components/loading";
import LogInForm from "@/components/login-form";
import { getServerURL } from "@/lib/utils";

export default function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [checking, setChecking] = useState(true);
    const checkedRef = useRef(false);

    useEffect(() => {
        if (checkedRef.current) return;
        checkedRef.current = true;

        const token = localStorage.getItem("token");
        if (!token) {
            setChecking(false);
            return;
        }

        fetch(`${getServerURL()}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (res) => {
                if (res.ok) {
                    // logged in, redirect to next if defined
                    // fallback to /app
                    const next = searchParams.get("next") || "/app";
                    navigate(next, { replace: true });
                } else {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
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
