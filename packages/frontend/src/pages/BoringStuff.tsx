import { Link } from "react-router-dom";
import ThemeToggle from "@/components/theme-toggle";
export default function BoringStuff() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="w-full flex h-14 items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Sprint" className="size-12 -mt-0.5" />
            <span className="text-3xl font-basteleur font-700 transition-colors -mt-0.5">Sprint</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="hidden md:block text-sm font-500 hover:text-personality transition-colors"
            >
              Home
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-12">
          <section className="space-y-6">
            <h1 className="text-4xl font-basteleur font-700">The Boring Stuff</h1>
            <p className="text-muted-foreground">Let's keep it short.</p>
          </section>

          <section className="space-y-6" id="privacy">
            <h2 className="text-2xl font-basteleur font-700">Privacy Policy</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">What we store:</strong> We store your email, name, and any
                data you create (issues, projects, time tracking).
              </p>
              <p>
                <strong className="text-foreground">How we use it:</strong> Only your email is used for
                subscription alerts and newsletters (you can unsubscribe).
              </p>
              <p>
                <strong className="text-foreground">Where it's stored:</strong> Data is stored on secure
                servers.
              </p>
              <p>
                {/* <strong className="text-foreground">Your rights:</strong> You can export or delete your data
                anytime. Just email us at privacy@sprintpm.org. */}
              </p>
              <p>
                <strong className="text-foreground">Cookies:</strong> We use essential cookies for
                authentication.
              </p>
            </div>
          </section>

          <section className="space-y-6" id="terms">
            <h2 className="text-2xl font-basteleur font-700">Terms of Service</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">The basics:</strong> Sprint is a project management tool.
                Use it to organise work, track issues, and manage time. Don't use it for illegal stuff.
              </p>
              <p>
                <strong className="text-foreground">Your account:</strong> You're responsible for keeping your
                login details secure. Don't share your account.
              </p>
              <p>
                <strong className="text-foreground">Payments:</strong> Pro plans are billed monthly or
                annually. Cancel anytime from your account settings. No refunds for partial months.
              </p>
              <p>
                <strong className="text-foreground">Service availability:</strong> We aim for 99.9% uptime but
                can't guarantee it. We may occasionally need downtime for maintenance.
              </p>
              <p>
                <strong className="text-foreground">Termination:</strong> We may suspend accounts that violate
                these terms.
              </p>
              <p>
                <strong className="text-foreground">Changes:</strong> We'll notify you of significant changes
                to these terms via email.
              </p>
            </div>
          </section>

          <section className="space-y-6" id="contact">
            <h2 className="text-2xl font-basteleur font-700">Questions?</h2>
            <p className="text-muted-foreground">
              Email us at{" "}
              <a href="mailto:support@sprintpm.org" className="text-personality hover:underline">
                support@sprintpm.org
              </a>{" "}
              - we'll get back to you within 24 hours.
            </p>
          </section>

          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
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
          <img src="/oliver-bryan.svg" alt="Oliver Bryan" className="w-4 h-4" />
        </a>
      </footer>
    </div>
  );
}
