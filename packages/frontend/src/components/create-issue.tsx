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
import { issue } from "@/lib/server";
import { cn } from "@/lib/utils";

export function CreateIssue({
    projectId,
    trigger,
    completeAction,
}: {
    projectId?: number;
    trigger?: React.ReactNode;
    completeAction?: (issueId: number) => void | Promise<void>;
}) {
    const userId = JSON.parse(localStorage.getItem("user") || "{}").id as number | undefined;

    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reset = () => {
        setTitle("");
        setDescription("");
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

        if (title.trim() === "" || description.trim().length > 2048) {
            return;
        }

        if (!userId) {
            setError("you must be logged in to create an issue");
            return;
        }

        if (!projectId) {
            setError("select a project first");
            return;
        }

        setSubmitting(true);

        try {
            await issue.create({
                projectId,
                title,
                description,
                onSuccess: async (data) => {
                    setOpen(false);
                    reset();
                    try {
                        await completeAction?.(data.id);
                    } catch (actionErr) {
                        console.error(actionErr);
                    }
                },
                onError: (message) => {
                    setError(message);
                    setSubmitting(false);
                },
            });
        } catch (err) {
            console.error(err);
            setError("failed to create issue");
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" disabled={!projectId}>
                        Create Issue
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className={cn("w-md", error && "border-destructive")}>
                <DialogHeader>
                    <DialogTitle>Create Issue</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid mt-2">
                        <Field
                            label="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            validate={(v) => (v.trim() === "" ? "Cannot be empty" : undefined)}
                            submitAttempted={submitAttempted}
                            placeholder="Demo Issue"
                        />
                        <Field
                            label="Description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            validate={(v) =>
                                v.trim().length > 2048 ? "Too long (2048 character limit)" : undefined
                            }
                            submitAttempted={submitAttempted}
                            placeholder="Optional details"
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
                                    (title.trim() === "" && submitAttempted) ||
                                    (description.trim().length > 2048 && submitAttempted)
                                }
                            >
                                {submitting ? "Creating..." : "Create"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
