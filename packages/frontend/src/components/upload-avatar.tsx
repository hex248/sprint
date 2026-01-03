import { Edit } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { user } from "@/lib/server";
import { cn } from "@/lib/utils";
import Avatar from "./avatar";

export function UploadAvatar({
    name,
    username,
    avatarURL,
    onAvatarUploaded,
    className,
}: {
    name?: string;
    username?: string;
    avatarURL?: string | null;
    onAvatarUploaded: (avatarURL: string) => void;
    label?: string;
    className?: string;
}) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showEdit, setShowEdit] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        await user.uploadAvatar({
            file,
            onSuccess: (url) => {
                onAvatarUploaded(url);
                setUploading(false);
            },
            onError: (msg) => {
                setError(msg);
                setUploading(false);
            },
        });
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
                />

                {!uploading && showEdit && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Edit className="size-6 text-white drop-shadow-md" />
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
