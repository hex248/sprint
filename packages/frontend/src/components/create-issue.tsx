import {
    ISSUE_DESCRIPTION_MAX_LENGTH,
    ISSUE_TITLE_MAX_LENGTH,
    type SprintRecord,
    type UserRecord,
} from "@issue/shared";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useAuthenticatedSession } from "@/components/session-provider";
import { StatusSelect } from "@/components/status-select";
import StatusTag from "@/components/status-tag";
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
import { SelectTrigger } from "@/components/ui/select";
import { UserSelect } from "@/components/user-select";
import { issue } from "@/lib/server";
import { cn } from "@/lib/utils";
import { SprintSelect } from "./sprint-select";

export function CreateIssue({
    projectId,
    sprints,
    members,
    statuses,
    trigger,
    completeAction,
    errorAction,
}: {
    projectId?: number;
    sprints?: SprintRecord[];
    members?: UserRecord[];
    statuses: Record<string, string>;
    trigger?: React.ReactNode;
    completeAction?: (issueNumber: number) => void | Promise<void>;
    errorAction?: (errorMessage: string) => void | Promise<void>;
}) {
    const { user } = useAuthenticatedSession();

    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [sprintId, setSprintId] = useState<string>("unassigned");
    const [assigneeId, setAssigneeId] = useState<string>("unassigned");
    const [status, setStatus] = useState<string>(Object.keys(statuses)[0] ?? "");
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reset = () => {
        setTitle("");
        setDescription("");
        setSprintId("unassigned");
        setAssigneeId("unassigned");
        setStatus(statuses?.[0] ?? "");
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
            title.trim() === "" ||
            description.trim().length > ISSUE_DESCRIPTION_MAX_LENGTH ||
            title.trim().length > ISSUE_TITLE_MAX_LENGTH
        ) {
            return;
        }

        if (!user.id) {
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
                sprintId: sprintId === "unassigned" ? null : Number(sprintId),
                assigneeId: assigneeId === "unassigned" ? null : Number(assigneeId),
                status: status.trim() === "" ? undefined : status,
                onSuccess: async (data) => {
                    setOpen(false);
                    reset();
                    try {
                        await completeAction?.(data.number);
                    } catch (actionErr) {
                        console.error(actionErr);
                    }
                },
                onError: (error) => {
                    setError(error);
                    setSubmitting(false);

                    toast.error(`Error creating issue: ${error}`, {
                        dismissible: false,
                    });
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
                    <div className="grid">
                        {statuses && Object.keys(statuses).length > 0 && (
                            <div className="flex items-center gap-2 mb-4">
                                <Label>Status</Label>
                                <StatusSelect
                                    statuses={statuses}
                                    value={status}
                                    onChange={(newValue) => {
                                        if (newValue.trim() === "") return; // TODO: handle this better
                                        // unsure why an empty value is being sent, but preventing it this way for now
                                        setStatus(newValue);
                                    }}
                                    trigger={({ isOpen, value }) => (
                                        <SelectTrigger
                                            className="group flex items-center w-min"
                                            variant="unstyled"
                                            chevronClassName="hidden"
                                            isOpen={isOpen}
                                        >
                                            <StatusTag
                                                status={value}
                                                colour={statuses[value]}
                                                className="hover:opacity-85"
                                            />
                                        </SelectTrigger>
                                    )}
                                />
                            </div>
                        )}

                        <Field
                            label="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            validate={(v) =>
                                v.trim() === ""
                                    ? "Cannot be empty"
                                    : v.trim().length > ISSUE_TITLE_MAX_LENGTH
                                      ? `Too long (${ISSUE_TITLE_MAX_LENGTH} character limit)`
                                      : undefined
                            }
                            submitAttempted={submitAttempted}
                            placeholder="Demo Issue"
                            maxLength={ISSUE_TITLE_MAX_LENGTH}
                        />
                        <Field
                            label="Description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            validate={(v) =>
                                v.trim().length > ISSUE_DESCRIPTION_MAX_LENGTH
                                    ? `Too long (${ISSUE_DESCRIPTION_MAX_LENGTH} character limit)`
                                    : undefined
                            }
                            submitAttempted={submitAttempted}
                            placeholder="Optional details"
                            maxLength={ISSUE_DESCRIPTION_MAX_LENGTH}
                        />

                        {sprints && sprints.length > 0 && (
                            <div className="flex items-center gap-2 mt-0">
                                <Label className="text-sm">Sprint</Label>
                                <SprintSelect sprints={sprints} value={sprintId} onChange={setSprintId} />
                            </div>
                        )}

                        {members && members.length > 0 && (
                            <div className="flex items-center gap-2 mt-4">
                                <Label className="text-sm">Assignee</Label>
                                <UserSelect users={members} value={assigneeId} onChange={setAssigneeId} />
                            </div>
                        )}

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
                                    ((title.trim() === "" || title.trim().length > ISSUE_TITLE_MAX_LENGTH) &&
                                        submitAttempted) ||
                                    (description.trim().length > ISSUE_DESCRIPTION_MAX_LENGTH &&
                                        submitAttempted)
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
