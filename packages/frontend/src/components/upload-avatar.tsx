import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { user } from "@/lib/server";
import { cn } from "@/lib/utils";

export function UploadAvatar({
    avatarURL,
    onAvatarUploaded,
    label,
    className,
}: {
    avatarURL?: string | null;
    onAvatarUploaded: (avatarURL: string) => void;
    label?: string;
    className?: string;
}) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className={cn("flex items-center gap-4", className)}>
            {avatarURL && (
                <img src={avatarURL} alt="Avatar" className="w-16 h-16 rounded-full border object-cover" />
            )}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
            />
            <Button
                variant="outline"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
            >
                {uploading ? "Uploading..." : label || avatarURL ? "Change Avatar" : "Upload Avatar"}
            </Button>
            {error && <Label className="text-destructive text-sm">{error}</Label>}
        </div>
    );
}
