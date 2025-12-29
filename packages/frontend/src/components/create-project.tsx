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

const blobify = (value: string) =>
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
    const serverURL = import.meta.env.VITE_SERVER_URL?.trim() || "http://localhost:3000";

    const userId = JSON.parse(localStorage.getItem("user") || "{}").id as number | undefined;

    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [blob, setBlob] = useState("");

    const [nameTouched, setNameTouched] = useState(false);
    const [blobTouched, setBlobTouched] = useState(false);
    const [blobManuallyEdited, setBlobManuallyEdited] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const nameInvalid = useMemo(
        () => ((nameTouched || submitAttempted) && name.trim() === "" ? "Cannot be empty" : ""),
        [nameTouched, submitAttempted, name],
    );

    const blobInvalid = useMemo(() => {
        if (!(blobTouched || submitAttempted)) return "";
        if (blob.trim() === "") return "Cannot be empty";
        if (blob.length !== 4) return "Must be 4 characters";
        return "";
    }, [blobTouched, submitAttempted, blob]);

    const reset = () => {
        setName("");
        setBlob("");

        setNameTouched(false);
        setBlobTouched(false);
        setBlobManuallyEdited(false);
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

        if (name.trim() === "" || blob.length !== 4) {
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
            const url = new URL(`${serverURL}/project/create`);
            url.searchParams.set("blob", blob);
            url.searchParams.set("name", name.trim());
            url.searchParams.set("creatorId", `${userId}`);
            url.searchParams.set("organisationId", `${organisationId}`);

            const res = await fetch(url.toString(), {
                headers: getAuthHeaders(),
            });

            if (!res.ok) {
                const message = await res.text();
                setError(message || `failed to create project (${res.status})`);
                setSubmitting(false);
                return;
            }

            const project = (await res.json()) as { id?: number };
            if (!project.id) {
                setError("failed to create project");
                setSubmitting(false);
                return;
            }

            setOpen(false);
            reset();
            try {
                await completeAction?.(project.id);
            } catch (actionErr) {
                console.error(actionErr);
            }
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
                    <div className="grid gap-4 mt-2">
                        <div className="grid gap-2">
                            <Label htmlFor="project-name">Name</Label>
                            <Input
                                id="project-name"
                                name="name"
                                value={name}
                                onChange={(e) => {
                                    const nextName = e.target.value;
                                    setName(nextName);

                                    if (!blobManuallyEdited) {
                                        setBlob(blobify(nextName));
                                    }
                                }}
                                onBlur={() => setNameTouched(true)}
                                aria-invalid={nameInvalid !== ""}
                                placeholder="Demo Project"
                                required
                            />
                            <div className="flex items-end justify-end w-full text-xs -mb-4 -mt-2">
                                {nameInvalid !== "" ? (
                                    <Label className="text-destructive text-sm">{nameInvalid}</Label>
                                ) : (
                                    <Label className="opacity-0 text-sm">a</Label>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="project-blob">Blob</Label>
                            <Input
                                id="project-blob"
                                name="blob"
                                value={blob}
                                onChange={(e) => {
                                    setBlob(blobify(e.target.value));
                                    setBlobManuallyEdited(true);
                                }}
                                onBlur={() => setBlobTouched(true)}
                                aria-invalid={blobInvalid !== ""}
                                placeholder="DEMO"
                                required
                            />
                            <div className="flex items-end justify-end w-full text-xs -mb-4 -mt-2">
                                {blobInvalid !== "" ? (
                                    <Label className="text-destructive text-sm">{blobInvalid}</Label>
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
                                disabled={submitting || nameInvalid !== "" || blobInvalid !== ""}
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
