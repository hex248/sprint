import { type ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getServerURL } from "@/lib/utils";

const DEFAULT_URL = "https://tnirps.ob248.com";

const formatURL = (url: string) => {
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  if (
    (url.includes("localhost") || url.includes("127.0.0.1")) &&
    !url.startsWith("http://") &&
    !url.startsWith("https://")
  ) {
    url = `http://${url}`; // use http for localhost
  } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`; // assume https if none is provided
  }
  return url;
};

const isValidURL = (url: string) => {
  try {
    new URL(formatURL(url));
    return true;
  } catch {
    return false;
  }
};

export function ServerConfiguration({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [serverURL, setServerURL] = useState(getServerURL());
  const [originalURL, setOriginalURL] = useState(getServerURL());
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const hasChanged = formatURL(serverURL) !== formatURL(originalURL);
  const isNotDefault = formatURL(serverURL) !== formatURL(DEFAULT_URL);
  const canSave = hasChanged && isValidURL(serverURL);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setServerURL(getServerURL());
      setOriginalURL(getServerURL());
      setIsValid(true);
      setCountdown(null);
      setHealthError(null);
    }
  };

  const handleServerURLChange = (value: string) => {
    setServerURL(value);
    setIsValid(isValidURL(value));
    setHealthError(null);
  };

  const handleResetToDefault = () => {
    setServerURL(DEFAULT_URL);
    setIsValid(true);
    setHealthError(null);
  };

  const handleSave = async () => {
    if (!canSave) return;

    setIsCheckingHealth(true);

    try {
      const response = await fetch(`${formatURL(serverURL)}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      setHealthError(null);

      localStorage.setItem("serverURL", formatURL(serverURL));

      let count = 3;
      setCountdown(count);
      setOpen(false);

      const interval = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(interval);
          window.location.reload();
        } else {
          setCountdown(count);
        }
      }, 1000);
    } catch (err) {
      setHealthError(err instanceof Error ? err.message : "Failed to connect to server");
    } finally {
      setIsCheckingHealth(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <IconButton size="lg" className="absolute top-2 right-2" title={"Server Configuration"}>
              <Icon icon="server" className="size-4" />
            </IconButton>
          )}
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Server Configuration</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="server-url">Server URL</Label>
              <div className="flex gap-2">
                <Input
                  id="server-url"
                  value={serverURL}
                  onChange={(e) => handleServerURLChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canSave && !isCheckingHealth) {
                      e.preventDefault();
                      void handleSave();
                    }
                  }}
                  placeholder="https://example.com"
                  className={!isValid ? "border-destructive" : ""}
                  spellCheck={false}
                />
                <IconButton
                  variant={canSave ? "primary" : "outline"}
                  size="md"
                  disabled={!canSave || isCheckingHealth}
                  onClick={handleSave}
                >
                  <Icon icon="checkIcon" className="size-4" />
                </IconButton>
                <IconButton
                  variant="secondary"
                  size="md"
                  disabled={!isNotDefault || isCheckingHealth}
                  onClick={handleResetToDefault}
                  title="Reset to default"
                >
                  <Icon icon="undo2" className="size-4" />
                </IconButton>
              </div>
              {!isValid && <Label className="text-destructive text-sm">Please enter a valid URL</Label>}
              {healthError && <Label className="text-destructive text-sm">{healthError}</Label>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {countdown !== null &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/50 flex flex-col items-center justify-center pointer-events-auto">
            <div className="text-2xl font-bold pointer-events-none noselect">Redirecting</div>
            <div className="text-8xl font-bold pointer-events-none noselect">{countdown}</div>
          </div>,
          document.body,
        )}
    </>
  );
}
