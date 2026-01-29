import { useRef, useState } from "react";
import { toast } from "sonner";
import Avatar from "@/components/avatar";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { useUploadAvatar } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn } from "@/lib/utils";

function isAnimatedGIF(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const arr = new Uint8Array(buffer);
      // check for GIF89a or GIF87a header
      const header = String.fromCharCode(...arr.slice(0, 6));
      if (header !== "GIF89a" && header !== "GIF87a") {
        resolve(false);
        return;
      }
      // look for multiple images (animation indicator)
      // GIFs have image descriptors starting with 0x2C
      // and graphic control extensions starting with 0x21 0xF9
      let frameCount = 0;
      let i = 6; // skip header
      while (i < arr.length - 1) {
        if (arr[i] === 0x21 && arr[i + 1] === 0xf9) {
          // graphic control extension - indicates animation frame
          frameCount++;
        }
        i++;
      }
      resolve(frameCount > 1);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 1024)); // only need first 1KB for header check
  });
}

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
  const { user } = useSession();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEdit, setShowEdit] = useState(false);
  const uploadAvatar = useUploadAvatar();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // check for animated GIF for free users
    if (user?.plan !== "pro" && file.type === "image/gif") {
      const isAnimated = await isAnimatedGIF(file);
      if (isAnimated) {
        setError("Animated avatars are only available on Pro. Upgrade to upload animated avatars.");
        toast.error("Animated avatars are only available on Pro. Upgrade to upload animated avatars.", {
          dismissible: false,
        });
        // reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
    }

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

      // check if the error is about animated avatars for free users
      if (message.toLowerCase().includes("animated") && message.toLowerCase().includes("pro")) {
        toast.error(
          <div className="flex flex-col gap-2">
            <span>Animated avatars are only available on Pro.</span>
            <a href="/plans" className="text-personality hover:underline">
              Upgrade to Pro
            </a>
          </div>,
          {
            dismissible: false,
            duration: 5000,
          },
        );
      } else {
        toast.error(`Error uploading avatar: ${message}`, {
          dismissible: false,
        });
      }
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
