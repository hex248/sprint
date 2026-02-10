import { useRef, useState } from "react";
import { toast } from "sonner";
import OrgIcon from "@/components/org-icon";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { useUploadOrganisationIcon } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn } from "@/lib/utils";

export function UploadOrgIcon({
  name,
  slug,
  iconURL,
  organisationId,
  onIconUploaded,
  className,
}: {
  name: string;
  slug: string;
  iconURL?: string | null;
  organisationId: number;
  onIconUploaded: (iconURL: string) => void;
  className?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEdit, setShowEdit] = useState(false);
  const uploadIcon = useUploadOrganisationIcon();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const url = await uploadIcon.mutateAsync({ file, organisationId });
      onIconUploaded(url);
      setUploading(false);

      toast.success(
        <div className="flex flex-col items-center gap-4">Organisation icon uploaded successfully</div>,
        {
          dismissible: false,
        },
      );
    } catch (err) {
      const message = parseError(err as Error);
      setError(message);
      setUploading(false);

      toast.error(`Error uploading icon: ${message}`, {
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
        className="size-24 rounded-lg border-1 p-0 relative overflow-hidden"
      >
        <OrgIcon name={name} slug={slug} iconURL={iconURL} size={24} textClass="text-4xl" />

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
