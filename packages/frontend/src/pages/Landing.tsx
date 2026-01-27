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
          <Link to="/pricing" className="text-sm hover:text-personality transition-colors">
            Pricing
          </Link>
          <ThemeToggle />
          {!isLoading && user ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/issues">Open app</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center py-16 px-4">
        <div className="max-w-6xl w-full space-y-24">
          {/* hero section */}
          <div className="text-center space-y-8 pt-8">
            <div className="space-y-4">
              <h1 className="text-[64px] font-basteleur font-700 leading-tight">
                ship faster without the chaos
              </h1>
              <p className="text-[24px] font-goudy text-muted-foreground max-w-3xl mx-auto">
                sprint is project management that stays out of your way. track issues, manage sprints, and
                keep your team moving—without the jira headache.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isLoading && user ? (
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link to="/issues">Open app</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="text-lg px-8 py-6">
                    <Link to="/login">start free trial</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                    <Link to="/pricing">see pricing</Link>
                  </Button>
                </>
              )}
            </div>

            <p className="text-sm text-muted-foreground font-goudy">
              no credit card required · full access for 14 days
            </p>
          </div>

          {/* problem section */}
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-4xl font-basteleur font-700 text-center">
              tired of spending more time managing jira than building product?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Icon icon="lucide:timer-off" className="size-8 text-muted-foreground mx-auto" />
                <p className="text-center font-goudy text-muted-foreground">
                  wasting hours configuring workflows instead of shipping features
                </p>
              </div>
              <div className="space-y-2">
                <Icon icon="lucide:boxes" className="size-8 text-muted-foreground mx-auto" />
                <p className="text-center font-goudy text-muted-foreground">
                  drowning in features you'll never use while missing the basics
                </p>
              </div>
              <div className="space-y-2">
                <Icon icon="lucide:bug-off" className="size-8 text-muted-foreground mx-auto" />
                <p className="text-center font-goudy text-muted-foreground">
                  context switching kills momentum—your flow state doesn't stand a chance
                </p>
              </div>
            </div>
          </div>

          {/* solution section */}
          <div className="max-w-5xl mx-auto space-y-12">
            <h2 className="text-5xl font-basteleur font-700 text-center">
              everything you need, nothing you don't
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border p-8 space-y-4">
                <Icon icon="lucide:layout-dashboard" className="size-10 text-personality" />
                <h3 className="text-2xl font-basteleur font-700">see your work at a glance</h3>
                <p className="font-goudy text-muted-foreground text-lg">
                  beautiful, intuitive issue tracking with customizable statuses. organize by projects and
                  sprints. find what you need in seconds, not minutes.
                </p>
              </div>

              <div className="border p-8 space-y-4">
                <Icon icon="lucide:timer" className="size-10 text-personality" />
                <h3 className="text-2xl font-basteleur font-700">track time without thinking</h3>
                <p className="font-goudy text-muted-foreground text-lg">
                  built-in time tracking that actually works. start, pause, resume. see where your time goes
                  without juggling another tool.
                </p>
              </div>

              <div className="border p-8 space-y-4">
                <Icon icon="lucide:rocket" className="size-10 text-personality" />
                <h3 className="text-2xl font-basteleur font-700">ship in sprints</h3>
                <p className="font-goudy text-muted-foreground text-lg">
                  sprint planning that actually works. set date ranges, assign issues, track velocity. keep
                  your team aligned without the ceremony.
                </p>
              </div>

              <div className="border p-8 space-y-4">
                <Icon icon="lucide:zap" className="size-10 text-personality" />
                <h3 className="text-2xl font-basteleur font-700">stay in flow</h3>
                <p className="font-goudy text-muted-foreground text-lg">
                  minimal clicks, maximum productivity. keyboard shortcuts, resizable panes, and a clean
                  interface that gets out of your way.
                </p>
              </div>
            </div>
          </div>

          {/* features list */}
          <div className="max-w-4xl mx-auto border p-8 space-y-6">
            <h2 className="text-3xl font-basteleur font-700 text-center">
              built for developers, by a developer
            </h2>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
              {[
                "organization and project management",
                "customizable issue statuses",
                "sprint planning with date ranges",
                "built-in time tracking",
                "role-based access control",
                "native desktop app (tauri)",
                "self-hostable on your infrastructure",
                "clean, resizable interface",
                "issue assignment and collaboration",
                "jwt authentication",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <Icon icon="lucide:check" className="size-5 text-personality shrink-0 mt-0.5" />
                  <span className="font-goudy">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* social proof placeholder */}
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-basteleur font-700">join developers who've escaped jira</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="border p-6 space-y-4">
                <p className="font-goudy text-lg italic text-muted-foreground">
                  "finally, a project management tool that doesn't slow me down"
                </p>
                <p className="text-sm font-goudy font-700">early user feedback</p>
              </div>
              <div className="border p-6 space-y-4">
                <p className="font-goudy text-lg italic text-muted-foreground">
                  "built by someone who actually understands developer workflows"
                </p>
                <p className="text-sm font-goudy font-700">early user feedback</p>
              </div>
              <div className="border p-6 space-y-4">
                <p className="font-goudy text-lg italic text-muted-foreground">
                  "the simplicity is refreshing. no bloat, just what we need"
                </p>
                <p className="text-sm font-goudy font-700">early user feedback</p>
              </div>
            </div>
          </div>

          {/* final cta */}
          <div className="text-center space-y-6 border-t pt-16">
            <h2 className="text-5xl font-basteleur font-700">ready to ship faster?</h2>
            <p className="text-xl font-goudy text-muted-foreground">
              start tracking issues, managing sprints, and shipping product in minutes
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isLoading && user ? (
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link to="/issues">Open app</Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link to="/login">start your free trial</Link>
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-goudy">
              no credit card required · 14-day free trial · cancel anytime
            </p>
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
