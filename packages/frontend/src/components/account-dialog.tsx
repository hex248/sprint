import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthenticatedSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { UploadAvatar } from "@/components/upload-avatar";
import { user } from "@/lib/server";

function AccountDialog({ trigger }: { trigger?: ReactNode }) {
    const { user: currentUser, setUser } = useAuthenticatedSession();

    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [avatarURL, setAvatarUrl] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [submitAttempted, setSubmitAttempted] = useState(false);

    useEffect(() => {
        if (!open) return;

        setName(currentUser.name);
        setUsername(currentUser.username);
        setAvatarUrl(currentUser.avatarURL || null);

        setPassword("");
        setError("");
        setSubmitAttempted(false);
    }, [open, currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitAttempted(true);

        if (name.trim() === "") {
            return;
        }

        await user.update({
            id: currentUser.id,
            name: name.trim(),
            password: password.trim(),
            avatarURL,
            onSuccess: (data) => {
                setError("");
                setUser(data);
                setPassword("");
                setOpen(false);

                toast.success(`Account updated successfully`, {
                    dismissible: false,
                });
            },
            onError: (error) => {
                setError(error);

                toast.error(`Error updating account: ${error}`, {
                    dismissible: false,
                });
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" className="flex w-full justify-end px-2 py-1 m-0 h-auto">
                        My Account
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Account</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <UploadAvatar
                        name={name}
                        username={username}
                        avatarURL={avatarURL}
                        onAvatarUploaded={setAvatarUrl}
                    />
                    {avatarURL && (
                        <Button
                            variant={"dummy"}
                            type={"button"}
                            onClick={() => {
                                setAvatarUrl(null);
                            }}
                            className="-mt-2 hover:text-personality"
                        >
                            Remove Avatar
                        </Button>
                    )}
                    <Field
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        validate={(v) => (v.trim() === "" ? "Cannot be empty" : undefined)}
                        submitAttempted={submitAttempted}
                    />
                    <Field
                        label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave empty to keep current password"
                        hidden={true}
                    />

                    {error !== "" && <Label className="text-destructive text-sm">{error}</Label>}

                    <div className="flex justify-end">
                        <Button variant={"outline"} type={"submit"} className="px-12">
                            Save
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default AccountDialog;
