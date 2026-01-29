import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LogInForm from "@/components/login-form";
import { useSession } from "@/components/session-provider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  dismissible?: boolean;
}

export function LoginModal({ open, onOpenChange, onSuccess, dismissible = true }: LoginModalProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading, emailVerified } = useSession();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [showWarning, setShowWarning] = useState(() => {
    return localStorage.getItem("hide-under-construction") !== "true";
  });

  useEffect(() => {
    if (open && !isLoading && user && emailVerified && !hasRedirected) {
      setHasRedirected(true);
      const next = searchParams.get("next") || "/issues";
      navigate(next, { replace: true });
      onSuccess?.();
      onOpenChange(false);
    }
  }, [open, user, isLoading, emailVerified, navigate, searchParams, onSuccess, onOpenChange, hasRedirected]);

  useEffect(() => {
    if (!open) {
      setHasRedirected(false);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!dismissible && !newOpen) {
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className={cn("p-0  w-xs py-8", showWarning && "w-md pt-4")}>
        <DialogTitle className="sr-only">Log In or Register</DialogTitle>
        <LogInForm showWarning={showWarning} setShowWarning={setShowWarning} />
      </DialogContent>
    </Dialog>
  );
}
