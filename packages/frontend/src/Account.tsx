import type { UserRecord } from "@issue/shared";
import { useEffect, useState } from "react";
import { SettingsPageLayout } from "@/components/settings-page-layout";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { UploadAvatar } from "@/components/upload-avatar";
import { user } from "@/lib/server";

function Account() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [avatarURL, setAvatarUrl] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr) as UserRecord;
            setName(user.name);
            setUserId(user.id);
            setAvatarUrl(user.avatarURL || null);
        }
    }, []);

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
            avatarURL: avatarURL || undefined,
            onSuccess: (data) => {
                setError("");
                localStorage.setItem("user", JSON.stringify(data));
                setPassword("");
            },
            onError: (errorMessage) => {
                setError(errorMessage);
            },
        });
    };

    return (
        <SettingsPageLayout title="Account">
            <form onSubmit={handleSubmit} className="flex flex-col p-4 gap-2 w-sm border">
                <h2 className="text-xl font-600 mb-2">Account Details</h2>
                <div>
                    <Label className="mb-4 block">Avatar</Label>
                    <UploadAvatar avatarURL={avatarURL} onAvatarUploaded={setAvatarUrl} />
                </div>
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
        </SettingsPageLayout>
    );
}

export default Account;
