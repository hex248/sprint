import { type FormEvent, useState } from "react";
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
import { organisation } from "@/lib/server";
import { cn } from "@/lib/utils";

const slugify = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+/, "")
        .replace(/-{2,}/g, "-");

export function CreateOrganisation({
    trigger,
    completeAction,
}: {
    trigger?: React.ReactNode;
    completeAction?: (organisationId: number) => void | Promise<void>;
}) {
    const userId = JSON.parse(localStorage.getItem("user") || "{}").id as number | undefined;

    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

        if (name.trim() === "" || slug.trim() === "") {
            return;
        }

        if (!userId) {
            setError("you must be logged in to create an organisation");
            return;
        }

        setSubmitting(true);
        try {
            await organisation.create({
                name,
                slug,
                description,
                userId,
                onSuccess: async (data) => {
                    setOpen(false);
                    reset();
                    try {
                        await completeAction?.(data.id);
                    } catch (actionErr) {
                        console.error(actionErr);
                    }
                },
                onError: (err) => {
                    setError(err || "failed to create organisation");
                    setSubmitting(false);
                },
            });
        } catch (err) {
            console.error(err);
            setError("failed to create organisation");
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Create Organisation</Button>}
            </DialogTrigger>

            <DialogContent className={cn("w-md", error && "border-destructive")}>
                <DialogHeader>
                    <DialogTitle>Create Organisation</DialogTitle>
                    {/* <DialogDescription>Enter the details for the new organisation.</DialogDescription> */}
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
                            validate={(v) => (v.trim() === "" ? "Cannot be empty" : undefined)}
                            submitAttempted={submitAttempted}
                            placeholder="Demo Organisation"
                        />
                        <Field
                            label="Slug"
                            value={slug}
                            onChange={(e) => {
                                setSlug(slugify(e.target.value));
                                setSlugManuallyEdited(true);
                            }}
                            validate={(v) => (v.trim() === "" ? "Cannot be empty" : undefined)}
                            submitAttempted={submitAttempted}
                            placeholder="demo-organisation"
                        />
                        <Field
                            label="Description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            validate={(v) =>
                                v.trim().length > 2048 ? "Too long (2048 character limit)" : undefined
                            }
                            submitAttempted={submitAttempted}
                            placeholder="What is this organisation for?"
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
                                    (slug.trim() === "" && submitAttempted)
                                }
                            >
                                {submitting ? "Creating..." : "Create"}
                            </Button>
                        </div>
                    </div>
                </form>

                {/* <DialogFooter> */}
                {/* </DialogFooter> */}
            </DialogContent>
        </Dialog>
    );
}
