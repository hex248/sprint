import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, getAuthHeaders } from "@/lib/utils";

export function CreateIssue({
    projectId,
    trigger,
    completeAction,
}: {
    projectId?: number;
    trigger?: React.ReactNode;
    completeAction?: (issueId: number) => void | Promise<void>;
}) {
    const serverURL = import.meta.env.VITE_SERVER_URL?.trim() || "http://localhost:3000";

    const userId = JSON.parse(localStorage.getItem("user") || "{}").id as number | undefined;

    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [titleTouched, setTitleTouched] = useState(false);
    const [descriptionTouched, setDescriptionTouched] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const titleInvalid = useMemo(
        () => ((titleTouched || submitAttempted) && title.trim() === "" ? "Cannot be empty" : ""),
        [titleTouched, submitAttempted, title],
    );

    const descriptionInvalid = useMemo(
        () =>
            (descriptionTouched || submitAttempted) && description.trim().length > 2048
                ? "Too long (2048 character limit)"
                : "",
        [descriptionTouched, submitAttempted, description],
    );

    const reset = () => {
        setTitle("");
        setDescription("");

        setTitleTouched(false);
        setDescriptionTouched(false);
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

        if (title.trim() === "" || descriptionInvalid !== "") {
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
            const url = new URL(`${serverURL}/issue/create`);
            url.searchParams.set("projectId", `${projectId}`);
            url.searchParams.set("title", title.trim());
            url.searchParams.set("description", description.trim());

            const res = await fetch(url.toString(), {
                headers: getAuthHeaders(),
            });

            if (!res.ok) {
                const message = await res.text();
                setError(message || `failed to create issue (${res.status})`);
                setSubmitting(false);
                return;
            }

            const issue = (await res.json()) as { id?: number };
            if (!issue.id) {
                setError("failed to create issue");
                setSubmitting(false);
                return;
            }

            setOpen(false);
            reset();
            try {
                await completeAction?.(issue.id);
            } catch (actionErr) {
                console.error(actionErr);
            }
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
                    <div className="grid gap-4 mt-2">
                        <div className="grid gap-2">
                            <Label htmlFor="issue-title">Title</Label>
                            <Input
                                id="issue-title"
                                name="title"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                }}
                                onBlur={() => setTitleTouched(true)}
                                aria-invalid={titleInvalid !== ""}
                                placeholder="Demo Issue"
                                required
                            />
                            <div className="flex items-end justify-end w-full text-xs -mb-4 -mt-2">
                                {titleInvalid !== "" ? (
                                    <Label className="text-destructive text-sm">{titleInvalid}</Label>
                                ) : (
                                    <Label className="opacity-0 text-sm">a</Label>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="issue-description">Description</Label>
                            <Input
                                id="issue-description"
                                name="description"
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                }}
                                onBlur={() => setDescriptionTouched(true)}
                                aria-invalid={descriptionInvalid !== ""}
                                placeholder="Optional details"
                            />
                            <div className="flex items-end justify-end w-full text-xs -mb-4 -mt-2">
                                {descriptionInvalid !== "" ? (
                                    <Label className="text-destructive text-sm">{descriptionInvalid}</Label>
                                ) : (
                                    <Label className="opacity-0 text-sm">a</Label>
                                )}
                            </div>
                        </div>

                        <div className="flex items-end justify-end w-full text-xs -mb-2 -mt-2">
                            {error ? (
                                <Label className="text-destructive text-sm">{error}</Label>
                            ) : (
                                <Label className="opacity-0 text-sm">a</Label>
                            )}
                        </div>

                        <div className="flex gap-2 w-full justify-end">
                            <DialogClose asChild>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={submitting || titleInvalid !== "" || descriptionInvalid !== ""}
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
