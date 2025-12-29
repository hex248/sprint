import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, getAuthHeaders } from "@/lib/utils";

const slugify = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "")
        .replace(/-{2,}/g, "-");

export function CreateOrganisation() {
    const serverURL = import.meta.env.VITE_SERVER_URL?.trim() || "http://localhost:3000";

    const userId = JSON.parse(localStorage.getItem("user") || "{}").id as number | undefined;

    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");

    const [nameTouched, setNameTouched] = useState(false);
    const [slugTouched, setSlugTouched] = useState(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const nameInvalid = useMemo(
        () => ((nameTouched || submitAttempted) && name.trim() === "" ? "Cannot be empty" : ""),
        [nameTouched, submitAttempted, name],
    );
    const slugInvalid = useMemo(
        () => ((slugTouched || submitAttempted) && slug.trim() === "" ? "Cannot be empty" : ""),
        [slugTouched, submitAttempted, slug],
    );

    const reset = () => {
        setName("");
        setSlug("");
        setDescription("");

        setNameTouched(false);
        setSlugTouched(false);
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
            const url = new URL(`${serverURL}/organisation/create`);
            url.searchParams.set("name", name.trim());
            url.searchParams.set("slug", slug.trim());
            url.searchParams.set("userId", `${userId}`);
            if (description.trim() !== "") {
                url.searchParams.set("description", description.trim());
            }

            const res = await fetch(url.toString(), {
                headers: getAuthHeaders(),
            });

            if (!res.ok) {
                const message = await res.text();
                setError(message || `failed to create organisation (${res.status})`);
                setSubmitting(false);
                return;
            }

            setOpen(false);
            window.location.reload();
        } catch (err) {
            console.error(err);
            setError("failed to create organisation");
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">Create Organisation</Button>
            </DialogTrigger>

            <DialogContent className={cn("w-md", error && "border-destructive")}>
                <DialogHeader>
                    <DialogTitle>Create Organisation</DialogTitle>
                    {/* <DialogDescription>Enter the details for the new organisation.</DialogDescription> */}
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 mt-2">
                        <div className="grid gap-2">
                            <Label htmlFor="org-name">Name</Label>
                            <Input
                                id="org-name"
                                name="name"
                                value={name}
                                onChange={(e) => {
                                    const nextName = e.target.value;
                                    setName(nextName);

                                    if (!slugManuallyEdited) {
                                        setSlug(slugify(nextName));
                                    }
                                }}
                                onBlur={() => setNameTouched(true)}
                                aria-invalid={nameInvalid !== ""}
                                placeholder="Demo Organisation"
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
                            <Label htmlFor="org-slug">Slug</Label>
                            <Input
                                id="org-slug"
                                name="slug"
                                value={slug}
                                onChange={(e) => {
                                    setSlug(slugify(e.target.value));
                                    setSlugManuallyEdited(true);
                                }}
                                onBlur={() => setSlugTouched(true)}
                                aria-invalid={slugInvalid !== ""}
                                placeholder="demo-organisation"
                                required
                            />
                            <div className="flex items-end justify-end w-full text-xs -mb-4 -mt-2">
                                {slugInvalid !== "" ? (
                                    <Label className="text-destructive text-sm">{slugInvalid}</Label>
                                ) : (
                                    <Label className="opacity-0 text-sm">a</Label>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="org-description">Description (optional)</Label>
                            <Input
                                id="org-description"
                                name="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What is this organisation for?"
                            />
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
                                disabled={submitting || nameInvalid !== "" || slugInvalid !== ""}
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
