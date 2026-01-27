import { HumanRun } from "@nsmr/pixelart-react";
import { Link } from "react-router-dom";
import { useSession } from "@/components/session-provider";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

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
        <div className="max-w-6xl w-full space-y-18">
          {/* hero section */}
          <div className="text-center space-y-8 pt-8">
            <div className="flex justify-center mb-8">
              <HumanRun size={144} fill="var(--foreground)" />
            </div>
            <div className="space-y-4">
              <h1 className="text-[64px] font-basteleur font-700 leading-tight">
                Ship faster without the chaos
              </h1>
              <p className="text-[24px] text-muted-foreground max-w-3xl mx-auto">
                Sprint is project management that stays out of your way. Track issues, manage sprints, and
                keep your team moving—without the Jira headache.
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
                    <Link to="/login">Start free trial</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                    <Link to="/pricing">See pricing</Link>
                  </Button>
                </>
              )}
            </div>

            <p className="text-sm text-muted-foreground">No credit card required · Full access for 14 days</p>
          </div>

          {/* problem section */}
          <div className="max-w-4xl mx-auto space-y-16">
            <h2 className="text-4xl font-basteleur font-700 text-center">
              Tired of spending more time managing Jira than building your product?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Icon icon="timerOff" className="size-16 mx-auto" color={"var(--muted-foreground)"} />
                <p className="text-center text-muted-foreground">
                  Wasting hours configuring workflows instead of shipping features
                </p>
              </div>
              <div className="space-y-2">
                <Icon icon="box" className="size-16 mx-auto" color={"var(--muted-foreground)"} />
                <p className="text-center text-muted-foreground">
                  Drowning in features you'll never use while missing the basics
                </p>
              </div>
              <div className="space-y-2">
                <Icon icon="bugOff" className="size-16 mx-auto" color={"var(--muted-foreground)"} />
                <p className="text-center text-muted-foreground">
                  Context switching kills momentum—your flow state doesn't stand a chance
                </p>
              </div>
            </div>
          </div>

          {/* solution section */}
          <div className="max-w-5xl mx-auto space-y-12">
            <h2 className="text-5xl font-basteleur font-700 text-center">
              Everything you need, nothing you don't
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border p-8 space-y-4">
                <Icon icon="layoutDashboard" className="size-10" color={"var(--personality)"} />
                <h3 className="text-2xl font-basteleur font-700">See your work at a glance</h3>
                <p className="text-muted-foreground text-lg">
                  Beautiful, intuitive issue tracking with customizable statuses. Organize by projects and
                  sprints. Find what you need in seconds, not minutes.
                </p>
              </div>

              <div className="border p-8 space-y-4">
                <Icon icon="timer" className="size-10" color={"var(--personality)"} />
                <h3 className="text-2xl font-basteleur font-700">Track time without thinking</h3>
                <p className="text-muted-foreground text-lg">
                  Built-in time tracking that actually works. Start, pause, resume. See where your time goes
                  without juggling another tool.
                </p>
              </div>

              <div className="border p-8 space-y-4">
                <Icon icon="rocket" className="size-10" color={"var(--personality)"} />
                <h3 className="text-2xl font-basteleur font-700">Ship in sprints</h3>
                <p className="text-muted-foreground text-lg">
                  Sprint planning that actually works. Set date ranges, assign issues, track velocity. Keep
                  your team aligned without the ceremony.
                </p>
              </div>

              <div className="border p-8 space-y-4">
                <Icon icon="checkBox" className="size-10" color={"var(--personality)"} />
                <h3 className="text-2xl font-basteleur font-700">Only use what you need</h3>
                <p className="text-muted-foreground text-lg">
                  Every feature is optional. Sprints, time tracking, and other modules can be enabled or
                  disabled individually at the organization level. Keep your interface as minimal as your
                  workflow.
                </p>
              </div>
            </div>
          </div>

          {/* features list */}
          <div className="max-w-4xl mx-auto border p-8 space-y-6">
            <h2 className="text-3xl font-basteleur font-700 text-center">
              Built for developers, by a developer
            </h2>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
              {[
                "Organization and project management",
                "Customizable issue statuses",
                "Sprint planning with date ranges",
                "Built-in time tracking",
                "Role-based access control",
                "Native desktop app (Tauri)",
                "Self-hostable on your infrastructure",
                "Clean, resizable interface",
                "Issue assignment and collaboration",
                "Individual feature toggles (org level)",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <Icon icon="check" className="size-5 shrink-0 mt-0.5" color={"var(--personality)"} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* social proof placeholder */}
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-basteleur font-700">Join developers who've escaped Jira</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="border p-6 space-y-4">
                <p className="text-lg italic text-muted-foreground">
                  "Finally, a project management tool that doesn't slow me down"
                </p>
                <p className="text-sm font-700">Early user feedback</p>
              </div>
              <div className="border p-6 space-y-4">
                <p className="text-lg italic text-muted-foreground">
                  "Built by someone who actually understands developer workflows"
                </p>
                <p className="text-sm font-700">Early user feedback</p>
              </div>
              <div className="border p-6 space-y-4">
                <p className="text-lg italic text-muted-foreground">
                  "The simplicity is refreshing. No bloat, just what we need"
                </p>
                <p className="text-sm font-700">Early user feedback</p>
              </div>
            </div>
          </div>

          {/* final cta */}
          <div className="text-center space-y-6 border-t pt-16">
            <h2 className="text-5xl font-basteleur font-700">Ready to ship faster?</h2>
            <p className="text-xl text-muted-foreground">
              Start tracking issues, managing sprints, and shipping product in minutes
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isLoading && user ? (
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link to="/issues">Open app</Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link to="/login">Start your free trial</Link>
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>
        </div>
      </main>

      <footer className="flex justify-center gap-2 items-center py-1 border-t">
        <span className="font-300 text-lg text-muted-foreground">
          Built by{" "}
          <a
            href="https://ob248.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-personality font-700"
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
