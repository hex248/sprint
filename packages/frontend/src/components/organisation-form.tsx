import {
  ORG_DESCRIPTION_MAX_LENGTH,
  ORG_NAME_MAX_LENGTH,
  ORG_SLUG_MAX_LENGTH,
  type OrganisationRecordType,
} from "@sprint/shared";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuthenticatedSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import Icon from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { UploadOrgIcon } from "@/components/upload-org-icon";
import { useCreateOrganisation, useImportOrganisation, useUpdateOrganisation } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn } from "@/lib/utils";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-{2,}/g, "-");

export function OrganisationForm({
  trigger,
  completeAction,
  errorAction,
  mode = "create",
  existingOrganisation,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  trigger?: React.ReactNode;
  completeAction?: (org: OrganisationRecordType) => void | Promise<void>;
  errorAction?: (errorMessage: string) => void | Promise<void>;
  mode?: "create" | "edit";
  existingOrganisation?: OrganisationRecordType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { user } = useAuthenticatedSession();
  const createOrganisation = useCreateOrganisation();
  const importOrganisation = useImportOrganisation();
  const updateOrganisation = useUpdateOrganisation();

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [iconURL, setIconURL] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const filePickerActiveRef = useRef(false);

  useEffect(() => {
    const onWindowFocus = () => {
      if (!filePickerActiveRef.current) return;
      window.setTimeout(() => {
        filePickerActiveRef.current = false;
      }, 500);
    };

    window.addEventListener("focus", onWindowFocus);
    return () => {
      window.removeEventListener("focus", onWindowFocus);
    };
  }, []);

  const isEdit = mode === "edit";

  useEffect(() => {
    if (isEdit && existingOrganisation && open) {
      setName(existingOrganisation.name);
      setSlug(existingOrganisation.slug);
      setDescription(existingOrganisation.description ?? "");
      setIconURL(existingOrganisation.iconURL ?? null);
      setSlugManuallyEdited(true);
    }
  }, [isEdit, existingOrganisation, open]);

  const reset = () => {
    setName("");
    setSlug("");
    setDescription("");
    setIconURL(null);
    setSlugManuallyEdited(false);
    setSubmitAttempted(false);
    setSubmitting(false);
    setImporting(false);
    setError(null);
  };

  const onOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && filePickerActiveRef.current) {
      return;
    }

    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
    }
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    if (!user.id) {
      setError("you must be logged in to import an organisation");
      return;
    }

    setImporting(true);
    try {
      const raw = await file.text();
      const payload = JSON.parse(raw);
      const data = await importOrganisation.mutateAsync(payload);

      setOpen(false);
      reset();
      toast.success(`Imported Organisation ${data.name}`, {
        dismissible: false,
      });

      try {
        await completeAction?.(data);
      } catch (actionErr) {
        console.error(actionErr);
      }
    } catch (err) {
      const message = parseError(err as Error);
      console.error(err);
      setError(message || "failed to import organisation");
      try {
        await errorAction?.(message || "failed to import organisation");
      } catch (actionErr) {
        console.error(actionErr);
      }
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitAttempted(true);

    if (name.trim() === "" || name.trim().length > ORG_NAME_MAX_LENGTH) return;
    if (slug.trim() === "" || slug.trim().length > ORG_SLUG_MAX_LENGTH) return;
    if (description.trim().length > ORG_DESCRIPTION_MAX_LENGTH) return;

    if (!user.id) {
      setError(`you must be logged in to ${isEdit ? "edit" : "create"} an organisation`);
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && existingOrganisation) {
        const data = await updateOrganisation.mutateAsync({
          id: existingOrganisation.id,
          name,
          slug,
          description,
        });
        setOpen(false);
        reset();
        toast.success("Organisation updated");
        try {
          await completeAction?.(data);
        } catch (actionErr) {
          console.error(actionErr);
        }
      } else {
        const data = await createOrganisation.mutateAsync({
          name,
          slug,
          description,
        });
        setOpen(false);
        reset();
        toast.success(`Created Organisation ${data.name}`, {
          dismissible: false,
        });
        try {
          await completeAction?.(data);
        } catch (actionErr) {
          console.error(actionErr);
        }
      }
    } catch (err) {
      const message = parseError(err as Error);
      console.error(err);
      setError(message || `failed to ${isEdit ? "update" : "create"} organisation`);
      setSubmitting(false);
      try {
        await errorAction?.(message || `failed to ${isEdit ? "update" : "create"} organisation`);
      } catch (actionErr) {
        console.error(actionErr);
      }
    }
  };

  const dialogContent = (
    <DialogContent
      className={cn("w-md", error ? "border-destructive" : "")}
      onInteractOutside={(event) => {
        if (filePickerActiveRef.current) {
          event.preventDefault();
        }
      }}
      onPointerDownOutside={(event) => {
        if (filePickerActiveRef.current) {
          event.preventDefault();
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Organisation" : "Create Organisation"}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <div className="grid mt-2">
          {isEdit && existingOrganisation && (
            <UploadOrgIcon
              name={name || existingOrganisation.name}
              slug={slug || existingOrganisation.slug}
              iconURL={iconURL}
              organisationId={existingOrganisation.id}
              onIconUploaded={setIconURL}
              className="mb-4"
            />
          )}
          <Field
            label="Name"
            value={name}
            onChange={(e) => {
              const nextName = e.target.value;
              setName(nextName);
              if (!slugManuallyEdited) {
                setSlug(slugify(nextName));
              }
            }}
            validate={(v) => {
              if (v.trim() === "") return "Cannot be empty";
              if (v.trim().length > ORG_NAME_MAX_LENGTH) {
                return `Too long (${ORG_NAME_MAX_LENGTH} character limit)`;
              }
              return undefined;
            }}
            submitAttempted={submitAttempted}
            placeholder="Demo Organisation"
            maxLength={ORG_NAME_MAX_LENGTH}
          />
          <Field
            label="Slug"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugManuallyEdited(true);
            }}
            validate={(v) => {
              if (v.trim() === "") return "Cannot be empty";
              if (v.trim().length > ORG_SLUG_MAX_LENGTH) {
                return `Too long (${ORG_SLUG_MAX_LENGTH} character limit)`;
              }
              return undefined;
            }}
            submitAttempted={submitAttempted}
            placeholder="demo-organisation"
            maxLength={ORG_SLUG_MAX_LENGTH}
          />
          <Field
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            validate={(v) => {
              if (v.trim().length > ORG_DESCRIPTION_MAX_LENGTH) {
                return `Too long (${ORG_DESCRIPTION_MAX_LENGTH} character limit)`;
              }
              return undefined;
            }}
            submitAttempted={submitAttempted}
            placeholder="What is this organisation for?"
            maxLength={ORG_DESCRIPTION_MAX_LENGTH}
          />

          <div className="flex items-end justify-end w-full text-xs -mb-2 -mt-2">
            {error ? (
              <Label className="text-destructive text-sm">{error}</Label>
            ) : (
              <Label className="opacity-0 text-sm">a</Label>
            )}
          </div>

          {!isEdit && (
            <>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportFile}
              />
              <div className="flex justify-start mt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting || importing}
                  onClick={() => {
                    filePickerActiveRef.current = true;
                    importInputRef.current?.click();
                  }}
                >
                  <Icon icon="upload" className="size-4" />
                  {importing ? "Importing..." : "Import JSON"}
                </Button>
              </div>
            </>
          )}

          <div className="flex gap-2 w-full justify-end mt-2">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={
                submitting ||
                importing ||
                name.trim() === "" ||
                name.trim().length > ORG_NAME_MAX_LENGTH ||
                slug.trim() === "" ||
                slug.trim().length > ORG_SLUG_MAX_LENGTH ||
                description.trim().length > ORG_DESCRIPTION_MAX_LENGTH
              }
            >
              {submitting ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </form>
    </DialogContent>
  );

  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Create Organisation</Button>}
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
