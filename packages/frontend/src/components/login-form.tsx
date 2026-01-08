/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import { useEffect, useState } from "react";
import { ServerConfigurationDialog } from "@/components/server-configuration-dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { UploadAvatar } from "@/components/upload-avatar";
import { capitalise, cn, getServerURL } from "@/lib/utils";

export default function LogInForm() {
    const [mode, setMode] = useState<"login" | "register">("login");

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [avatarURL, setAvatarUrl] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const logIn = () => {
        if (username.trim() === "" || password.trim() === "") {
            return;
        }

        fetch(`${getServerURL()}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({ username, password }),
        })
            .then(async (res) => {
                if (res.status === 200) {
                    setError("");
                    const data = await res.json();
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                    window.location.href = "";
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

    const register = () => {
        if (name.trim() === "" || username.trim() === "" || password.trim() === "") {
            return;
        }

        fetch(`${getServerURL()}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                username,
                password,
                avatarURL,
            }),
        })
            .then(async (res) => {
                if (res.status === 200) {
                    setError("");
                    const data = await res.json();
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                    window.location.href = "";
                }
                // bad request (probably a bad user input)
                else if (res.status === 400) {
                    setError(await res.text());
                } else {
                    setError("An unknown error occured.");
                }
            })
            .catch((err) => {
                console.error(err);
                setError(`${err.statusText}`);
            });
    };

    const focusFirstInput = () => {
        const firstInput = document.querySelector('input[type="text"]');
        if (firstInput) {
            (firstInput as HTMLInputElement).focus();
        }
    };

    useEffect(() => {
        focusFirstInput();
    }, []);

    const resetForm = () => {
        setError("");
        setSubmitAttempted(false);
        setAvatarUrl(null);
        requestAnimationFrame(() => focusFirstInput());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitAttempted(true);
        if (mode === "login") {
            logIn();
        } else {
            register();
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <div
                    className={cn(
                        "relative flex flex-col gap-2 items-center border p-6 pb-4",
                        error !== "" && "border-destructive",
                    )}
                >
                    <ServerConfigurationDialog />
                    <span className="text-xl ">{capitalise(mode)}</span>

                    <div className={"flex flex-col items-center mb-0"}>
                        {mode === "register" && (
                            <>
                                <UploadAvatar
                                    name={name}
                                    username={username || undefined}
                                    avatarURL={avatarURL}
                                    onAvatarUploaded={setAvatarUrl}
                                    className={"mt-2 mb-4"}
                                />
                                <Field
                                    label="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    validate={(v) => (v.trim() === "" ? "Cannot be empty" : undefined)}
                                    submitAttempted={submitAttempted}
                                    spellcheck={false}
                                />
                            </>
                        )}
                        <Field
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            validate={(v) => (v.trim() === "" ? "Cannot be empty" : undefined)}
                            submitAttempted={submitAttempted}
                            spellcheck={false}
                        />
                        <Field
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            validate={(v) => (v.trim() === "" ? "Cannot be empty" : undefined)}
                            hidden={true}
                            submitAttempted={submitAttempted}
                            spellcheck={false}
                        />
                    </div>

                    {mode === "login" ? (
                        <>
                            <Button variant={"outline"} type={"submit"}>
                                Log in
                            </Button>
                            <Button
                                className="text-xs hover:underline p-0"
                                variant={"dummy"}
                                type="button"
                                onClick={() => {
                                    setMode("register");
                                    resetForm();
                                }}
                            >
                                I don't have an account
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant={"outline"} type={"submit"}>
                                Register
                            </Button>
                            <Button
                                className="text-xs hover:underline p-0"
                                variant={"dummy"}
                                type="button"
                                onClick={() => {
                                    setMode("login");
                                    resetForm();
                                }}
                            >
                                I already have an account
                            </Button>
                        </>
                    )}
                </div>
            </form>
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
