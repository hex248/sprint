import {
    ORG_DESCRIPTION_MAX_LENGTH,
    ORG_NAME_MAX_LENGTH,
    ORG_SLUG_MAX_LENGTH,
    type OrganisationRecord,
} from "@sprint/shared";
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
import { organisation, parseError } from "@/lib/server";
import { cn } from "@/lib/utils";

const slugify = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+/, "")
        .replace(/-{2,}/g, "-");

export function OrganisationModal({
    trigger,
    completeAction,
    errorAction,
    mode = "create",
    existingOrganisation,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: {
    trigger?: React.ReactNode;
    completeAction?: (org: OrganisationRecord) => void | Promise<void>;
    errorAction?: (errorMessage: string) => void | Promise<void>;
    mode?: "create" | "edit";
    existingOrganisation?: OrganisationRecord;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const { user } = useAuthenticatedSession();

    const isControlled = controlledOpen !== undefined;
    const [internalOpen, setInternalOpen] = useState(false);
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEdit = mode === "edit";

    useEffect(() => {
        if (isEdit && existingOrganisation && open) {
            setName(existingOrganisation.name);
            setSlug(existingOrganisation.slug);
            setDescription(existingOrganisation.description ?? "");
            setSlugManuallyEdited(true);
        }
    }, [isEdit, existingOrganisation, open]);

    const reset = () => {
        setName("");
        setSlug("");
        setDescription("");
        setSlugManuallyEdited(false);
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
                await organisation.update({
                    organisationId: existingOrganisation.id,
                    name,
                    slug,
                    description,
                    onSuccess: async (data) => {
                        setOpen(false);
                        reset();
                        toast.success("Organisation updated");
                        try {
                            await completeAction?.(data);
                        } catch (actionErr) {
                            console.error(actionErr);
                        }
                    },
                    onError: async (err) => {
                        const message = parseError(err);
                        setError(message || "failed to update organisation");
                        setSubmitting(false);
                        try {
                            await errorAction?.(message || "failed to update organisation");
                        } catch (actionErr) {
                            console.error(actionErr);
                        }
                    },
                });
            } else {
                await organisation.create({
                    name,
                    slug,
                    description,
                    onSuccess: async (data) => {
                        setOpen(false);
                        reset();
                        try {
                            await completeAction?.(data);
                        } catch (actionErr) {
                            console.error(actionErr);
                        }
                    },
                    onError: async (err) => {
                        const message = parseError(err);
                        setError(message || "failed to create organisation");
                        setSubmitting(false);
                        try {
                            await errorAction?.(message || "failed to create organisation");
                        } catch (actionErr) {
                            console.error(actionErr);
                        }
                    },
                });
            }
        } catch (err) {
            console.error(err);
            setError(`failed to ${isEdit ? "update" : "create"} organisation`);
            setSubmitting(false);
        }
    };

    const dialogContent = (
        <DialogContent className={cn("w-md", error ? "border-destructive" : "")}>
            <DialogHeader>
                <DialogTitle>{isEdit ? "Edit Organisation" : "Create Organisation"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
                <div className="grid mt-2">
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
