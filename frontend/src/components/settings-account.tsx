import type { IconStyle } from "@sprint/shared";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthenticatedSession } from "@/components/session-provider";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import Icon from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UploadAvatar } from "@/components/upload-avatar";
import { useUpdateUser } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn } from "@/lib/utils";

const DEFAULT_ICON_STYLE: IconStyle = "pixel";

export function SettingsAccount() {
  const { user: currentUser, setUser } = useAuthenticatedSession();
  const updateUser = useUpdateUser();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatarURL, setAvatarUrl] = useState<string | null>(null);
  const [iconPreference, setIconPreference] = useState<IconStyle>("pixel");
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    setName(currentUser.name);
    setUsername(currentUser.username);
    setAvatarUrl(currentUser.avatarURL || null);
    const effectiveIconStyle = (currentUser.iconPreference as IconStyle) ?? DEFAULT_ICON_STYLE;
    setIconPreference(effectiveIconStyle);
    setPreferences(currentUser.preferences ?? {});

    setPassword("");
    setError("");
    setSubmitAttempted(false);
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (name.trim() === "") {
      return;
    }

    try {
      const data = await updateUser.mutateAsync({
        name: name.trim(),
        password: password.trim() || undefined,
        avatarURL,
        iconPreference,
        preferences,
      });
      setError("");
      setUser(data);
      setPassword("");

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
    <section
      className={cn(
        "flex flex-1 flex-col gap-3 border p-3 overflow-auto",
        error !== "" && "border-destructive",
      )}
    >
      <h2 className="text-xl font-600">Account settings</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-md">
        <span className="text-center">@{username}</span>
        <UploadAvatar name={name} username={username} avatarURL={avatarURL} onAvatarUploaded={setAvatarUrl} />
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

        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={Boolean(preferences.assignByDefault)}
              onCheckedChange={(checked) => {
                setPreferences((prev) => ({ ...prev, assignByDefault: checked }));
              }}
            />
            <span className="text-sm">Assign to me by default</span>
          </div>
          {/* <div className="flex items-center gap-2">
            <Switch
              checked={preferences.aiFeatures ?? true}
              onCheckedChange={(checked) => {
                setPreferences((prev) => ({ ...prev, aiFeatures: checked }));
              }}
            />
            <span className="text-sm">AI features</span>
          </div> */}
        </div>

        <div className="flex gap-8 justify w-full">
          <div className="flex flex-col items-start gap-1">
            <Label className="text-sm">Light/Dark Mode</Label>
            <ThemeToggle withText />
          </div>
          <div className="flex flex-col items-start gap-1">
            <Label className="text-sm">Icon Style</Label>
            <Select value={iconPreference} onValueChange={(v) => setIconPreference(v as IconStyle)}>
              <SelectTrigger className={cn("w-full")}>
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
          </div>
        </div>

        {error !== "" && <Label className="text-destructive text-sm">{error}</Label>}

        <div className="flex justify-end mt-2">
          <Button variant={"outline"} type={"submit"} className="px-12">
            Save
          </Button>
        </div>
      </form>
    </section>
  );
}
