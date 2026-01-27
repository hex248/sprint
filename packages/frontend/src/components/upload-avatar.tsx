import { useRef, useState } from "react";
import { toast } from "sonner";
import Avatar from "@/components/avatar";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { useUploadAvatar } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn } from "@/lib/utils";

export function UploadAvatar({
  name,
  username,
  avatarURL,
  onAvatarUploaded,
  skipOrgCheck = false,
  className,
}: {
  name?: string;
  username?: string;
  avatarURL?: string | null;
  onAvatarUploaded: (avatarURL: string) => void;
  label?: string;
  skipOrgCheck?: boolean;
  className?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEdit, setShowEdit] = useState(false);
  const uploadAvatar = useUploadAvatar();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const url = await uploadAvatar.mutateAsync(file);
      onAvatarUploaded(url);
      setUploading(false);

      toast.success(<div className="flex flex-col items-center gap-4">Avatar uploaded successfully</div>, {
        dismissible: false,
      });
    } catch (err) {
      const message = parseError(err as Error);
      setError(message);
      setUploading(false);

      toast.error(`Error uploading avatar: ${message}`, {
        dismissible: false,
      });
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <Button
        variant="dummy"
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onMouseOver={() => setShowEdit(true)}
        onMouseOut={() => setShowEdit(false)}
        className="w-24 h-24 rounded-full border-1 p-0 relative overflow-hidden"
      >
        <Avatar
          name={name}
          username={username}
          avatarURL={avatarURL}
          size={24}
          textClass={"text-4xl"}
          strong
          skipOrgCheck={skipOrgCheck}
        />

        {!uploading && showEdit && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Icon icon="edit" className="size-6 text-white drop-shadow-md" />
          </div>
        )}
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
      />
      {error && <Label className="text-destructive text-sm">{error}</Label>}
    </div>
  );
}
