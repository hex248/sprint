import type { UserRecord } from "@issue/shared";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { UploadAvatar } from "@/components/upload-avatar";
import { user } from "@/lib/server";

function AccountDialog({ onUpdate, trigger }: { onUpdate?: () => void; trigger?: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [avatarURL, setAvatarUrl] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        if (!open) return;

        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr) as UserRecord;
            setName(user.name);
            setUsername(user.username);
            setUserId(user.id);
            setAvatarUrl(user.avatarURL || null);
        }

        setPassword("");
        setError("");
        setSubmitAttempted(false);
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitAttempted(true);

        if (name.trim() === "") {
            return;
        }

        if (!userId) {
            setError("User not found");
            return;
        }

        await user.update({
            id: userId,
            name: name.trim(),
            password: password.trim(),
            avatarURL,
            onSuccess: (data) => {
                setError("");
                localStorage.setItem("user", JSON.stringify(data));
                setPassword("");
                onUpdate?.();
                setOpen(false);
            },
            onError: (errorMessage) => {
                setError(errorMessage);
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
