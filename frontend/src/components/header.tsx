import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LoginModal } from "@/components/login-modal";
import { useSession } from "@/components/session-provider";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onSignInClick?: () => void;
}

export default function Header({ onSignInClick }: HeaderProps) {
  const { user, isLoading } = useSession();
  const { pathname } = useLocation();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const homeHref = pathname === "/" ? "#top" : "/#top";
  const featuresHref = pathname === "/" ? "#features" : "/#features";

  const handleSignIn = () => {
    if (onSignInClick) {
      onSignInClick();
      return;
    }

    setLoginModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="w-full flex h-14 items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Sprint" className="size-12 -mt-0.5" />
            <span className="text-3xl font-basteleur font-700 transition-colors -mt-0.5">Sprint</span>
          </div>

          <nav className="flex items-center gap-6">
            <a
              href={homeHref}
              className="hidden md:block text-sm font-500 hover:text-personality transition-colors"
            >
              Home
            </a>
            <a
              href={featuresHref}
              className="hidden md:block text-sm font-500 hover:text-personality transition-colors"
            >
              Features
            </a>
            <a
              href="/changelog"
              className="hidden md:block text-sm font-500 hover:text-personality transition-colors"
            >
              Changelog
            </a>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {!isLoading && user ? (
                <Button asChild variant="outline" size="sm">
                  <Link to="/issues">Open app</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleSignIn}>
                  Sign in
                </Button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {!onSignInClick ? <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} /> : null}
    </>
  );
}
