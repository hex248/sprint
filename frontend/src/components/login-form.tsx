/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */

import { USER_EMAIL_MAX_LENGTH, USER_NAME_MAX_LENGTH, USER_USERNAME_MAX_LENGTH } from "@sprint/shared";
import { useEffect, useState } from "react";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { UploadAvatar } from "@/components/upload-avatar";
import { capitalise, cn, getServerURL, setCsrfToken } from "@/lib/utils";

export default function LogInForm() {
  const { setUser, setEmailVerified } = useSession();

  const [mode, setMode] = useState<"login" | "register">("login");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
      credentials: "include",
    })
      .then(async (res) => {
        if (res.status === 200) {
          setError("");
          const data = await res.json();
          setCsrfToken(data.csrfToken);
          setUser(data.user);
          setEmailVerified(data.user.emailVerified);
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
    if (name.trim() === "" || username.trim() === "" || email.trim() === "" || password.trim() === "") {
      return;
    }

    fetch(`${getServerURL()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        username,
        email,
        password,
        avatarURL,
      }),
      credentials: "include",
    })
      .then(async (res) => {
        if (res.status === 200) {
          setError("");
          const data = await res.json();
          setCsrfToken(data.csrfToken);
          setUser(data.user);
          setEmailVerified(data.user.emailVerified);
        }
        // bad request (probably a bad user input)
        else if (res.status === 400) {
          const data = await res.json();
          const firstDetail = data.details ? Object.values(data.details).flat().find(Boolean) : "";
          setError(firstDetail || data.error || "Bad request");
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
    setEmail("");
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
            "relative flex flex-col gap-2 items-center p-4 pb-2",
            error !== "" && "border-destructive",
          )}
        >
          <span className="text-xl font-basteleur mb-2">{capitalise(mode)}</span>

          <div
            className={cn("mb-0 flex flex-col", mode === "register" ? "w-full gap-2 px-1" : "items-center")}
          >
            {mode === "register" && (
              <>
                <UploadAvatar
                  name={name}
                  username={username || undefined}
                  avatarURL={avatarURL}
                  onAvatarUploaded={setAvatarUrl}
                  skipOrgCheck
                  className="mb-2 self-center"
                />
                {avatarURL && (
                  <Button
                    variant={"dummy"}
                    type={"button"}
                    onClick={() => {
                      setAvatarUrl(null);
                    }}
                    className="-mt-2 mb-2 hover:text-personality"
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
                  spellcheck={false}
                  maxLength={USER_NAME_MAX_LENGTH}
                />
                <Field
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  validate={(v) => (v.trim() === "" ? "Cannot be empty" : undefined)}
                  submitAttempted={submitAttempted}
                  spellcheck={false}
                  maxLength={USER_EMAIL_MAX_LENGTH}
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
              maxLength={USER_USERNAME_MAX_LENGTH}
              showCounter={mode === "register"}
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
                className="text-xs hover:text-personality p-0"
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
                className="text-xs hover:text-personality p-0"
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
