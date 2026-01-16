import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { useSession } from "@/components/session-provider";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function Landing() {
    const { user, isLoading } = useSession();

    return (
        <div className="min-h-screen flex flex-col">
            <header className="relative flex items-center justify-center p-2 border-b">
                <div className="text-3xl font-basteleur font-700">Sprint</div>
                <nav className="absolute right-2 flex items-center gap-4">
                    <ThemeToggle />
                    {!isLoading && user ? (
                        <>
                            {user && (
                                <h1 className="text-xl font-basteleur font-400">
                                    Welcome back {user.name.split(" ")[0]}!
                                </h1>
                            )}
                            <Button asChild variant="outline" size="sm">
                                <Link to="/app">Open app</Link>
                            </Button>
                        </>
                    ) : (
                        <Button asChild variant="outline" size="sm">
                            <Link to="/login">Sign in</Link>
                        </Button>
                    )}
                </nav>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center gap-8">
                <div className="max-w-3xl text-center space-y-4">
                    <h1 className="text-[54px] font-basteleur font-700">
                        Need a snappy project management tool?
                    </h1>
                    <p className="text-[24px] font-goudy text-muted-foreground">
                        Build your next project with <span className="font-goudy font-700">Sprint.</span>
                    </p>
                    <p className="text-[18px] font-goudy text-muted-foreground font-700">
                        Sick of Jira? Say hello to your new favorite project management tool.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-8">
                    {!isLoading && user ? (
                        <Button asChild size="lg">
                            <Link to="/app">Open app</Link>
                        </Button>
                    ) : (
                        <Button asChild size="lg">
                            <Link to="/login">Get started</Link>
                        </Button>
                    )}
                    <div className="inline-flex gap-2 items-center">
                        <span className="relative">
                            <a
                                href="https://github.com/hex248/issue"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex gap-2 text-muted-foreground hover:text-personality"
                            >
                                <Icon icon="mdi:github" className="h-7 w-7" />
                                <span className="font-goudy font-700 text-2xl">GitHub</span>
                            </a>
                            <span className="text-violet-400/90 absolute left-full top-[45%] ml-4 -translate-y-1/2 whitespace-nowrap select-none text-muted-foreground">
                                {"<-- you can self-host me!"}
                            </span>
                        </span>
                    </div>
                </div>
            </main>

            <footer className="flex justify-center gap-2 items-center py-1 border-t">
                <span className="font-300 text-lg text-muted-foreground font-goudy">
                    Built by{" "}
                    <a
                        href="https://ob248.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-personality font-goudy font-700"
                    >
                        Oliver Bryan
                    </a>
                </span>
                <a href="https://ob248.com" target="_blank" rel="noopener noreferrer">
                    <img src="oliver-bryan.svg" alt="Oliver Bryan" className="w-4 h-4" />
                </a>
            </footer>
        </div>
    );
}
