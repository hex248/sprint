import { type ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, getAuthHeaders } from "@/lib/utils";

function Field({
    label = "label",
    onChange = () => {},
    invalidMessage = "",
    hidden = false,
}: {
    label: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    invalidMessage?: string;
    hidden?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-end justify-between w-full text-xs">
                <Label className="flex items-center text-sm">{label}</Label>
            </div>
            <Input
                placeholder={label}
                onChange={onChange}
                aria-invalid={invalidMessage !== ""}
                type={hidden ? "password" : "text"}
            />
            <div className="flex items-end justify-end w-full text-xs -mb-4">
                {invalidMessage !== "" ? (
                    <Label className="text-destructive text-sm">{invalidMessage}</Label>
                ) : (
                    <Label className="opacity-0 text-sm">a</Label>
                )}
            </div>
        </div>
    );
}

export default function LogInForm() {
    const serverURL = import.meta.env.SERVER_URL?.trim() || "http://localhost:3000";

    const [username, setUsername] = useState("");
    const [usernameInvalid, setUsernameInvalid] = useState("");
    const [password, setPassword] = useState("");
    const [passwordInvalid, setPasswordInvalid] = useState("");
    const [error, setError] = useState("");

    const logIn = () => {
        if (username === "" || password === "") {
            if (username === "") {
                setUsernameInvalid("Cannot be empty");
            }
            if (password === "") {
                setPasswordInvalid("Cannot be empty");
            }
            return;
        }

        fetch(`${serverURL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },

            body: JSON.stringify({ username, password }),
        })
            .then(async (res) => {
                if (res.status === 200) {
                    setError("");
                    const data = await res.json();
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", data.user);
                    window.location.href = "/";
                }
                // unauthorized
                else if (res.status === 401) {
                    setError("Either the username or password is incorrect");
                } else {
                    setError("An unknown error occured.");
                }
            })
            .catch((err) => {
                console.error(err);
                setError(`${err.statusText}`);
            });
    };

    return (
        <div>
            <div
                className={cn(
                    "flex flex-col gap-2 items-center border p-8",
                    error !== "" && "border-destructive",
                )}
            >
                <Field
                    label="Username"
                    onChange={(e) => {
                        if (e.target.value !== "") setUsernameInvalid("");
                        else setUsernameInvalid("Cannot be empty");
                        setUsername(e.target.value);
                    }}
                    invalidMessage={usernameInvalid}
                />
                <Field
                    label="Password"
                    onChange={(e) => {
                        if (e.target.value !== "") setPasswordInvalid("");
                        else setPasswordInvalid("Cannot be empty");
                        setPassword(e.target.value);
                    }}
                    invalidMessage={passwordInvalid}
                    hidden={true}
                />
                <Button variant={"outline"} onClick={logIn} className={"mt-4"} type={"submit"}>
                    Log in
                </Button>
            </div>
            <div className="flex items-end justify-end w-full text-xs -mb-4">
                {error !== "" ? (
                    <Label className="text-destructive text-sm">{error}</Label>
                ) : (
                    <Label className="opacity-0 text-sm">a</Label>
                )}
            </div>
        </div>
    );
}
