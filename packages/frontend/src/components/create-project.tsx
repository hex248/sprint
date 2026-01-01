import type { ProjectRecord } from "@issue/shared";
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
import { project } from "@/lib/server";
import { cn } from "@/lib/utils";

const keyify = (value: string) =>
    value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 4);

export function CreateProject({
    organisationId,
    trigger,
    completeAction,
}: {
    organisationId?: number;
    trigger?: React.ReactNode;
    completeAction?: (projectId: number) => void | Promise<void>;
}) {
    const userId = JSON.parse(localStorage.getItem("user") || "{}").id as number | undefined;

    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [key, setKey] = useState("");
    const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

        if (name.trim() === "" || key.trim() === "" || key.length > 4) {
            return;
        }

        if (!userId) {
            setError("you must be logged in to create a project");
            return;
        }

        if (!organisationId) {
            setError("select an organisation first");
            return;
        }

        setSubmitting(true);
        try {
            await project.create({
                key,
                name,
                creatorId: userId,
                organisationId,
                onSuccess: async (data) => {
                    const project = data as ProjectRecord;

                    setOpen(false);
                    reset();
                    try {
                        await completeAction?.(project.id);
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
            setError("failed to create project");
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" disabled={!organisationId}>
                        Create Project
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className={cn("w-md", error && "border-destructive")}>
                <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
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
                            validate={(v) => (v.trim() === "" ? "Cannot be empty" : undefined)}
                            submitAttempted={submitAttempted}
                            placeholder="Demo Project"
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
                                    ((key.trim() === "" || key.length > 4) && submitAttempted)
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
