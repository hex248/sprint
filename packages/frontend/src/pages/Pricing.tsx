import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { useSession } from "@/components/session-provider";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const pricingTiers = [
  {
    name: "Indie",
    price: "£0",
    period: "Free forever",
    description: "Perfect for individual developers and small teams",
    features: ["1 organisation (owned or joined)", "1 project", "100 issues", "Up to 5 users"],
    cta: "Get started",
    ctaLink: "/login",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "£12",
    period: "per user/month",
    description: "For growing teams and professional developers",
    features: [
      "Unlimited issues",
      "Unlimited projects",
      "Unlimited organisations",
      "Time tracking & reports",
    ],
    cta: "Start free trial",
    ctaLink: "/login",
    highlighted: true,
  },
];

export default function Pricing() {
  const { user, isLoading } = useSession();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="relative flex items-center justify-center p-2 border-b">
        <div className="text-3xl font-basteleur font-700">Sprint</div>
        <nav className="absolute right-2 flex items-center gap-4">
          <Link to="/" className="text-sm hover:text-personality transition-colors">
            Home
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
        <div className="max-w-4xl w-full space-y-16">
          <div className="text-center space-y-8">
            <h1 className="text-5xl font-basteleur font-700">Simple, transparent pricing</h1>
            <p className="text-2xl font-goudy text-muted-foreground">Choose the plan that fits your team</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col border p-8 ${
                  tier.highlighted ? "border-2 border-personality shadow-lg relative" : "border-border"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-personality text-background px-4 py-1 text-sm font-600">
                    Most popular
                  </div>
                )}

                <div className="space-y-4 mb-8">
                  <h2 className="text-4xl font-basteleur font-700">{tier.name}</h2>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-600">{tier.price}</span>
                      <span className="text-md text-muted-foreground">{tier.period}</span>
                    </div>
                  </div>

                  <p className="text-xl font-goudy text-muted-foreground">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Icon icon="lucide:check" className="size-5 text-personality shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={tier.highlighted ? "default" : "outline"}
                  className={cn("font-700", tier.highlighted ? "bg-personality hover:bg-personality/90" : "")}
                >
                  <Link to={tier.ctaLink}>{tier.cta}</Link>
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center flex flex-col items-center justify-center gap-2">
            <p className="text-xl font-goudy text-muted-foreground">Need something custom? </p>
            <a
              href="mailto:ob248@proton.me"
              className="text-personality hover:underline font-goudy text-lg font-700"
            >
              Get in touch
            </a>
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
