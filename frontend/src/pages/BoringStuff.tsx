import { Link } from "react-router-dom";
export default function BoringStuff() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-center items-center gap-6 py-2 border-b">
        <Link to="/" className="text-sm text-muted-foreground hover:text-personality transition-colors">
          Go back home
        </Link>
      </header>

      <main className="flex-1 px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-10">
          <section className="space-y-6">
            <h1 className="text-4xl font-basteleur font-700">The Boring Stuff</h1>
            <p className="text-muted-foreground">Let's keep it short.</p>
          </section>

          <section className="space-y-6" id="privacy">
            <h2 className="text-2xl font-basteleur font-700">Privacy Policy</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">What I store:</strong> I store your email, name, and any
                data you create (issues, projects, time tracking).
              </p>
              <p>
                <strong className="text-foreground">How I use it:</strong> Only your email is used for
                subscription alerts and newsletters (you can unsubscribe).
              </p>
              <p>
                <strong className="text-foreground">Where it's stored:</strong> Data is stored on secure
                servers.
              </p>
              <p>
                {/* <strong className="text-foreground">Your rights:</strong> You can export or delete your data
                anytime. Jmet email me at privacy@sprintpm.org. */}
              </p>
              <p>
                <strong className="text-foreground">Cookies:</strong> I use essential cookies for
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
              {/* <p>
                <strong className="text-foreground">Payments:</strong> Pro plans are billed monthly or
                annually. Cancel anytime from your account settings. No refunds for partial months.
              </p> */}
              <p>
                <strong className="text-foreground">Service availability:</strong> I aim for 99.9% uptime but
                can't guarantee it. I may occasionally need downtime for maintenance.
              </p>
              <p>
                <strong className="text-foreground">Termination:</strong> I may suspend accounts that violate
                these terms.
              </p>
              <p>
                <strong className="text-foreground">Changes:</strong> I'll notify you of significant changes
                to these terms via email.
              </p>
            </div>
          </section>

          <section className="space-y-6" id="contact">
            <h2 className="text-2xl font-basteleur font-700">Questions?</h2>
            <p className="text-muted-foreground">
              Email me at{" "}
              <a href="mailto:sprint@oliverbryan.com" className="text-personality hover:underline">
                sprint@oliverbryan.com
              </a>{" "}
              - I'll get back to you within 48 hours.
            </p>
          </section>

          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">Last updated: March 2026</p>
          </div>
        </div>
      </main>

      <footer className="flex justify-center items-center gap-6 py-1 border-t">
        <Link to="/" className="text-sm text-muted-foreground hover:text-personality transition-colors">
          Go back home
        </Link>
        <div className="flex justify-center gap-2 items-center">
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
        </div>
      </footer>
    </div>
  );
}
