import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { clearAuth, cn, getCsrfToken, getServerURL } from "@/lib/utils";

export default function LogOutButton({
  noStyle = false,
  className,
}: {
  noStyle?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();

  const logOut = async () => {
    const csrfToken = getCsrfToken();
    const headers: HeadersInit = {};
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

    try {
      await fetch(`${getServerURL()}/auth/logout`, {
        method: "POST",
        headers,
        credentials: "include",
      });
    } catch {}

    clearAuth();
    navigate(0);
  };

  return (
    <Button
      onClick={logOut}
      variant={noStyle ? "dummy" : "destructive"}
      className={cn("flex gap-2 items-center", noStyle && "px-2 py-1 m-0 h-auto", className)}
      size={noStyle ? "none" : "default"}
    >
      Log out
      <Icon icon="logOut" size={15} />
    </Button>
  );
}
