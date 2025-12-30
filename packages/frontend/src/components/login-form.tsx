/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { capitalise, cn } from "@/lib/utils";

function Field({
    label = "label",
    onChange = () => {},
    onBlur,
    invalidMessage = "",
    hidden = false,
}: {
    label: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    onBlur?: () => void;
    invalidMessage?: string;
    hidden?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-end justify-between w-full text-xs">
                <Label htmlFor="org-slug" className="flex items-center text-sm">
                    {label}
                </Label>
            </div>
            <Input
                id="org-slug"
                placeholder={label}
                onChange={onChange}
                onBlur={onBlur}
                name={label}
                aria-invalid={invalidMessage !== ""}
                type={hidden ? "password" : "text"}
            />
            <div className="flex items-end justify-end w-full text-xs -mb-0 -mt-1">
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
    const serverURL = import.meta.env.VITE_SERVER_URL?.trim() || "http://localhost:3000";

    const [mode, setMode] = useState<"login" | "register">("login");

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [nameTouched, setNameTouched] = useState(false);
    const [usernameTouched, setUsernameTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const [error, setError] = useState("");

    const nameInvalid = useMemo(
        () => ((nameTouched || submitAttempted) && name.trim() === "" ? "Cannot be empty" : ""),
        [nameTouched, submitAttempted, name],
    );
    const usernameInvalid = useMemo(
        () => ((usernameTouched || submitAttempted) && username.trim() === "" ? "Cannot be empty" : ""),
        [usernameTouched, submitAttempted, username],
    );
    const passwordInvalid = useMemo(
        () => ((passwordTouched || submitAttempted) && password.trim() === "" ? "Cannot be empty" : ""),
        [passwordTouched, submitAttempted, password],
    );

    const logIn = () => {
        if (username.trim() === "" || password.trim() === "") {
            return;
        }

        fetch(`${serverURL}/auth/login`, {
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

        fetch(`${serverURL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                username,
                password,
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
        const firstInput = document.querySelector("input");
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

        setNameTouched(false);
        setUsernameTouched(false);
        setPasswordTouched(false);

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
                        "flex flex-col gap-2 items-center border p-6 pb-4",
                        error !== "" && "border-destructive",
                    )}
                >
                    <span className="text-xl mb-2">{capitalise(mode)}</span>

                    {mode === "register" && (
                        <Field
                            label="Full Name"
                            onChange={(e) => setName(e.target.value)}
                            onBlur={() => setNameTouched(true)}
                            invalidMessage={nameInvalid}
                        />
                    )}
                    <Field
                        label="Username"
                        onChange={(e) => setUsername(e.target.value)}
                        onBlur={() => setUsernameTouched(true)}
                        invalidMessage={usernameInvalid}
                    />
                    <Field
                        label="Password"
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setPasswordTouched(true)}
                        invalidMessage={passwordInvalid}
                        hidden={true}
                    />

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
