import type { UserRecord } from "@issue/shared";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
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
import { organisation, parseError, user } from "@/lib/server";

export function AddMemberDialog({
    organisationId,
    existingMembers,
    trigger,
    onSuccess,
}: {
    organisationId: number;
    existingMembers: string[];
    trigger?: React.ReactNode;
    onSuccess?: (user: UserRecord) => void | Promise<void>;
}) {
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState("");
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reset = () => {
        setUsername("");
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

        if (username.trim() === "") {
            return;
        }

        if (existingMembers.includes(username)) {
            setError("user is already a member of this organisation");
            return;
        }

        setSubmitting(true);
        try {
            let userId: number | null = null;
            let userData: UserRecord;
            await user.byUsername({
                username,
                onSuccess: (data: UserRecord) => {
                    userData = data;
                    userId = data.id;
                },
                onError: (err) => {
                    const message = parseError(err);
                    setError(message || "user not found");
                    setSubmitting(false);

                    toast.error(`Error adding member: ${message}`, {
                        dismissible: false,
                    });
                },
            });

            if (!userId) {
                return;
            }

            await organisation.addMember({
                organisationId,
                userId,
                role: "member",
                onSuccess: async () => {
                    setOpen(false);
                    reset();
                    try {
                        await onSuccess?.(userData);
                    } catch (actionErr) {
                        console.error(actionErr);
                    }
                },
                onError: (err) => {
                    const message = parseError(err);
                    setError(message || "failed to add member");
                    setSubmitting(false);

                    toast.error(`Error adding member: ${message}`, {
                        dismissible: false,
                    });
                },
            });
        } catch (err) {
            console.error(err);
            setError("failed to add member");
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{trigger || <Button variant="outline">Add Member</Button>}</DialogTrigger>

            <DialogContent className={"w-md"}>
                <DialogHeader>
                    <DialogTitle>Add Member</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid mt-2">
                        <Field
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            validate={(v) => (v.trim() === "" ? "Cannot be empty" : undefined)}
                            submitAttempted={submitAttempted}
                            placeholder="Enter username"
                            error={error || undefined}
                        />

                        <div className="flex gap-2 w-full justify-end mt-2">
                            <DialogClose asChild>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={submitting || (username.trim() === "" && submitAttempted)}
                            >
                                {submitting ? "Adding..." : "Add"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
