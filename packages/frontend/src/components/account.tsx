import type { IconStyle } from "@sprint/shared";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuthenticatedSession } from "@/components/session-provider";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import Icon from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadAvatar } from "@/components/upload-avatar";
import { useUpdateUser } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn } from "@/lib/utils";

// icon style is locked to pixel for free users
const DEFAULT_ICON_STYLE: IconStyle = "pixel";

function Account({ trigger }: { trigger?: ReactNode }) {
  const { user: currentUser, setUser } = useAuthenticatedSession();
  const updateUser = useUpdateUser();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatarURL, setAvatarUrl] = useState<string | null>(null);
  const [iconPreference, setIconPreference] = useState<IconStyle>("pixel");
  const [error, setError] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!open) return;

    setName(currentUser.name);
    setUsername(currentUser.username);
    setAvatarUrl(currentUser.avatarURL || null);
    // free users are locked to pixel icon style
    const effectiveIconStyle =
      currentUser.plan === "pro"
        ? ((currentUser.iconPreference as IconStyle) ?? DEFAULT_ICON_STYLE)
        : DEFAULT_ICON_STYLE;
    setIconPreference(effectiveIconStyle);

    setPassword("");
    setError("");
    setSubmitAttempted(false);
  }, [open, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (name.trim() === "") {
      return;
    }

    try {
      // only send iconPreference for pro users
      const effectiveIconPreference = currentUser.plan === "pro" ? iconPreference : undefined;
      const data = await updateUser.mutateAsync({
        name: name.trim(),
        password: password.trim() || undefined,
        avatarURL,
        iconPreference: effectiveIconPreference,
      });
      setError("");
      setUser(data);
      setPassword("");
      setOpen(false);

      toast.success("Account updated successfully", {
        dismissible: false,
      });
    } catch (err) {
      const message = parseError(err as Error);
      setError(message);

      toast.error(`Error updating account: ${message}`, {
        dismissible: false,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" className="flex w-full justify-end px-2 py-1 m-0 h-auto">
            My Account
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className={cn("sm:max-w-sm", error !== "" && "border border-destructive")}>
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <UploadAvatar
            name={name}
            username={username}
            avatarURL={avatarURL}
            onAvatarUploaded={setAvatarUrl}
          />
          {avatarURL && (
            <Button
              variant={"dummy"}
              type={"button"}
              onClick={() => {
                setAvatarUrl(null);
              }}
              className="-mt-2 hover:text-personality"
            >
              Remove Avatar
            </Button>
          )}
          <Field
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            validate={(v) => (v.trim() === "" ? "Cannot be empty" : undefined)}
            submitAttempted={submitAttempted}
          />
          <Field
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave empty to keep current password"
            hidden={true}
          />
          <Label className="text-lg -mt-2">Preferences</Label>

          <div className="flex gap-8 justify w-full">
            <div className="flex flex-col items-start gap-1">
              <Label className="text-sm">Light/Dark Mode</Label>
              <ThemeToggle withText />
            </div>
            <div className="flex flex-col items-start gap-1">
              <Label className={cn("text-sm", currentUser.plan !== "pro" && "text-muted-foreground")}>
                Icon Style
              </Label>
              <Select
                value={iconPreference}
                onValueChange={(v) => setIconPreference(v as IconStyle)}
                disabled={currentUser.plan !== "pro"}
              >
                <SelectTrigger
                  className={cn("w-full", currentUser.plan !== "pro" && "cursor-not-allowed opacity-60")}
                  title={
                    currentUser.plan !== "pro"
                      ? "icon style customization is only available on Pro"
                      : undefined
                  }
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start">
                  <SelectItem value="pixel">
                    <div className="flex items-center gap-2">
                      <Icon icon="sun" iconStyle="pixel" size={16} />
                      Pixel
                    </div>
                  </SelectItem>
                  <SelectItem value="lucide">
                    <div className="flex items-center gap-2">
                      <Icon icon="sun" iconStyle="lucide" size={16} />
                      Lucide
                    </div>
                  </SelectItem>
                  <SelectItem value="phosphor">
                    <div className="flex items-center gap-2">
                      <Icon icon="sun" iconStyle="phosphor" size={16} />
                      Phosphor
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {currentUser.plan !== "pro" && (
                <span className="text-xs text-muted-foreground">
                  <Link to="/plans" className="text-personality hover:underline">
                    Upgrade to Pro
                  </Link>{" "}
                  to customize icon style
                </span>
              )}
            </div>
          </div>

          {error !== "" && <Label className="text-destructive text-sm">{error}</Label>}

          {/* Show subscription management link */}
          <div className="pt-2">
            {currentUser.plan === "pro" ? (
              <Button asChild className="w-fit bg-personality hover:bg-personality/90 font-700">
                <Link to="/plans">Manage subscription</Link>
              </Button>
            ) : (
              <Button asChild className="w-fit bg-personality hover:bg-personality/90 font-700">
                <Link to="/plans">Upgrade to Pro</Link>
              </Button>
            )}
          </div>

          <div className="flex justify-end mt-2">
            <Button variant={"outline"} type={"submit"} className="px-12">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Account;
