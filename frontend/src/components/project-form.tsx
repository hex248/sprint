import { PROJECT_NAME_MAX_LENGTH, type ProjectRecord } from "@sprint/shared";
import { type FormEvent, useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { useCreateProject, useUpdateProject } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn } from "@/lib/utils";

const keyify = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);

export function ProjectForm({
  organisationId,
  trigger,
  completeAction,
  mode = "create",
  existingProject,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  organisationId?: number;
  trigger?: React.ReactNode;
  completeAction?: (project: ProjectRecord) => void | Promise<void>;
  mode?: "create" | "edit";
  existingProject?: ProjectRecord;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { user } = useAuthenticatedSession();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === "edit";

  useEffect(() => {
    if (isEdit && existingProject && open) {
      setName(existingProject.name);
      setKey(existingProject.key);
      setKeyManuallyEdited(true);
    }
  }, [isEdit, existingProject, open]);

  const reset = () => {
    setName("");
    setKey("");
    setKeyManuallyEdited(false);
    setSubmitAttempted(false);
    setSubmitting(false);
    setError(null);
  };

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitAttempted(true);

    if (
      name.trim() === "" ||
      name.trim().length > PROJECT_NAME_MAX_LENGTH ||
      key.trim() === "" ||
      key.length > 4
    ) {
      return;
    }

    if (!user.id) {
      setError(`you must be logged in to ${isEdit ? "edit" : "create"} a project`);
      return;
    }

    if (!isEdit && !organisationId) {
      setError("select an organisation first");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && existingProject) {
        const proj = await updateProject.mutateAsync({
          id: existingProject.id,
          key,
          name,
        });
        setOpen(false);
        reset();
        toast.success("Project updated");
        try {
          await completeAction?.(proj);
        } catch (actionErr) {
          console.error(actionErr);
        }
      } else {
        if (!organisationId) {
          setError("select an organisation first");
          return;
        }
        const proj = await createProject.mutateAsync({
          key,
          name,
          organisationId,
        });
        setOpen(false);
        reset();
        toast.success(`Created Project ${proj.name}`, {
          dismissible: false,
        });
        try {
          await completeAction?.(proj);
        } catch (actionErr) {
          console.error(actionErr);
        }
      }
    } catch (err) {
      const message = parseError(err as Error);
      console.error(err);
      setError(message || `failed to ${isEdit ? "update" : "create"} project`);
      setSubmitting(false);
      toast.error(`Error ${isEdit ? "updating" : "creating"} project: ${message}`, {
        dismissible: false,
      });
    }
  };

  const dialogContent = (
    <DialogContent className={cn("w-md", error ? "border-destructive" : "")}>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Project" : "Create Project"}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <div className="grid mt-2">
          <Field
            label="Name"
            value={name}
            onChange={(e) => {
              const nextName = e.target.value;
              setName(nextName);
              if (!keyManuallyEdited) {
                setKey(keyify(nextName));
              }
            }}
            validate={(v) => {
              if (v.trim() === "") return "Cannot be empty";
              if (v.trim().length > PROJECT_NAME_MAX_LENGTH) {
                return `Too long (${PROJECT_NAME_MAX_LENGTH} character limit)`;
              }
              return undefined;
            }}
            submitAttempted={submitAttempted}
            placeholder="Demo Project"
            maxLength={PROJECT_NAME_MAX_LENGTH}
          />
          <Field
            label="Key"
            value={key}
            onChange={(e) => {
              setKey(keyify(e.target.value));
              setKeyManuallyEdited(true);
            }}
            validate={(v) => {
              if (v.trim() === "") return "Cannot be empty";
              if (v.length > 4) return "Must be 4 or less characters";
              return undefined;
            }}
            submitAttempted={submitAttempted}
            placeholder="DEMO"
          />

          <div className="flex items-end justify-end w-full text-xs -mb-2 -mt-2">
            {error ? (
              <Label className="text-destructive text-sm">{error}</Label>
            ) : (
              <Label className="opacity-0 text-sm">a</Label>
            )}
          </div>

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
                (name.trim() === "" && submitAttempted) ||
                (name.trim().length > PROJECT_NAME_MAX_LENGTH && submitAttempted) ||
                ((key.trim() === "" || key.length > 4) && submitAttempted)
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
        {trigger || (
          <Button variant="outline" disabled={!organisationId}>
            Create Project
          </Button>
        )}
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
