/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */

import { USER_NAME_MAX_LENGTH, USER_USERNAME_MAX_LENGTH } from "@sprint/shared";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Avatar from "@/components/avatar";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Label } from "@/components/ui/label";
import { UploadAvatar } from "@/components/upload-avatar";
import { capitalise, cn, getServerURL, setCsrfToken } from "@/lib/utils";

const DEMO_USERS = [
  { name: "User 1", username: "u1", password: "a" },
  { name: "User 2", username: "u2", password: "a" },
];

export default function LogInForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useSession();

  const [loginDetailsOpen, setLoginDetailsOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(() => {
    return localStorage.getItem("hide-under-construction") !== "true";
  });

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
      credentials: "include",
    })
      .then(async (res) => {
        if (res.status === 200) {
          setError("");
          const data = await res.json();
          setCsrfToken(data.csrfToken);
          setUser(data.user);
          const next = searchParams.get("next") || "/issues";
          navigate(next, { replace: true });
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
      credentials: "include",
    })
      .then(async (res) => {
        if (res.status === 200) {
          setError("");
          const data = await res.json();
          setCsrfToken(data.csrfToken);
          setUser(data.user);
          const next = searchParams.get("next") || "/issues";
          navigate(next, { replace: true });
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
    <>
      {/* under construction warning */}
      {showWarning && (
        <div className="relative flex flex-col border p-4 items-center border-border/50 bg-border/10 gap-2 max-w-lg">
          <IconButton
            size="md"
            className="absolute top-2 right-2"
            onClick={() => {
              localStorage.setItem("hide-under-construction", "true");
              setShowWarning(false);
            }}
          >
            <Icon icon="x" />
          </IconButton>
          <Icon icon="alertTriangle" className="w-16 h-16 text-yellow-500" />
          <div className="text-center text-sm text-muted-foreground font-500">
            <p>
              This application is currently under construction. Your data is very likely to be lost at some
              point.
            </p>
            <p className="font-700 underline underline-offset-3 text-foreground/85 decoration-yellow-500 mt-2">
              It is not recommended for production use.
            </p>
            <p className="mt-2">But you're more than welcome to have a look around!</p>
            <Dialog open={loginDetailsOpen} onOpenChange={setLoginDetailsOpen}>
              <DialogTrigger className="text-primary hover:text-personality cursor-pointer mt-2">
                Login Details
              </DialogTrigger>
              <DialogContent className="w-xs" showCloseButton={false}>
                <DialogTitle className="sr-only">Demo Login Credentials</DialogTitle>
                <div className="grid grid-cols-2 gap-4">
                  {DEMO_USERS.map((user) => (
                    <button
                      type="button"
                      key={user.username}
                      className="space-y-2 border border-background hover:border-border hover:bg-border/10 cursor-pointer p-2 text-left"
                      onClick={() => {
                        setMode("login");
                        setUsername(user.username);
                        setPassword(user.password);
                        setLoginDetailsOpen(false);
                        resetForm();
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={user.name} username={user.username} />
                        <span className="font-semibold">{user.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <span className="font-medium text-foreground">Username:</span> {user.username}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Password:</span> {user.password}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
      <div>
        <form onSubmit={handleSubmit}>
          <div
            className={cn(
              "relative flex flex-col gap-2 items-center border p-6 pb-4",
              error !== "" && "border-destructive",
            )}
          >
            <span className="text-xl font-basteleur mb-2">{capitalise(mode)}</span>

            <div className={"flex flex-col items-center mb-0"}>
              {mode === "register" && (
                <>
                  <UploadAvatar
                    name={name}
                    username={username || undefined}
                    avatarURL={avatarURL}
                    onAvatarUploaded={setAvatarUrl}
                    skipOrgCheck
                    className="mb-2"
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
    </>
  );
}
