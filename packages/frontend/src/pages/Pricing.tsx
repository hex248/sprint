import { useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "@/components/session-provider";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const pricingTiers = [
  {
    name: "Starter",
    price: "£0",
    priceAnnual: "£0",
    period: "Free forever",
    description: "Perfect for side projects and solo developers",
    tagline: "For solo devs and small projects",
    features: [
      "1 organisation (owned or joined)",
      "1 project",
      "100 issues",
      "Up to 5 team members",
      "Basic time tracking",
      "Email support",
    ],
    cta: "Get started free",
    ctaLink: "/login",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "£11.99",
    priceAnnual: "£9.99",
    period: "per user/month",
    periodAnnual: "per user/month",
    description: "For growing teams and professionals",
    tagline: "Most Popular",
    features: [
      "Everything in starter",
      "Unlimited organisations",
      "Unlimited projects",
      "Unlimited issues",
      "Advanced time tracking & reports",
      "Sprint velocity tracking",
      "Priority email support",
      "Custom issue statuses",
      "Role-based permissions",
    ],
    cta: "Try pro free for 14 days",
    ctaLink: "/login",
    highlighted: true,
  },
];

const faqs = [
  {
    question: "Can I switch plans?",
    answer:
      "Yes, you can upgrade or downgrade at any time. Changes take effect immediately, and we'll prorate any charges.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes, pro plan includes a 14-day free trial with full access. No credit card required to start.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards.",
  },
  {
    question: "What if I need more users?",
    answer:
      "Pro plan pricing scales with your team. Add or remove users anytime, and we'll adjust your billing automatically.",
  },
  {
    question: "What happens when my trial ends?",
    answer:
      "You'll automatically downgrade to the free starter plan. No charges unless you actively upgrade to pro.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. Cancel anytime with no questions asked. You'll keep access until the end of your billing period.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee. If Sprint isn't right for you, just let us know.",
  },
];

export default function Pricing() {
  const { user, isLoading } = useSession();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

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
        <div className="max-w-5xl w-full space-y-16 flex flex-col items-center">
          {/* header section */}
          <div className="text-center space-y-8">
            <h1 className="text-5xl font-basteleur font-700">Simple, transparent pricing</h1>
            <p className="text-2xl font-goudy text-muted-foreground">
              Choose the plan that fits your team. Scale as you grow.
            </p>

            {/* billing toggle */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setBillingPeriod("monthly")}
                className={cn(
                  "text-lg transition-colors",
                  billingPeriod === "monthly" ? "text-foreground font-700" : "text-muted-foreground",
                )}
              >
                monthly
              </button>
              <button
                type="button"
                className="relative w-14 h-8 bg-border rounded-full"
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
                aria-label="toggle billing period"
              >
                <div
                  className={cn(
                    "absolute top-1 w-6 h-6 bg-personality rounded-full transition-transform",
                    billingPeriod === "annual" ? "translate-x-7" : "translate-x-1",
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod("annual")}
                className={cn(
                  "text-lg transition-colors",
                  billingPeriod === "annual" ? "text-foreground font-700" : "text-muted-foreground",
                )}
              >
                annual
              </button>
              <span className="text-md px-3 pb-1 pt-1.25 bg-personality/10 text-personality rounded-full font-600">
                Save 17%
              </span>
            </div>
          </div>

          {/* pricing tiers */}
          <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col border p-8 ${
                  tier.highlighted
                    ? "border-2 border-personality shadow-lg relative scale-105"
                    : "border-border"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-personality text-background px-4 py-1 text-sm font-600">
                    {tier.tagline}
                  </div>
                )}

                <div className="space-y-4 mb-8">
                  <h2 className="text-3xl font-basteleur font-700">{tier.name}</h2>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-600">
                        {billingPeriod === "annual" ? tier.priceAnnual : tier.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {billingPeriod === "annual" ? tier.periodAnnual : tier.period}
                      </span>
                    </div>
                  </div>

                  <p className="text-lg font-goudy text-muted-foreground">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Icon icon="check" className="size-5 text-personality shrink-0 mt-0.5" />
                      <span className={"text-sm"}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={tier.highlighted ? "default" : "outline"}
                  className={cn(
                    "font-700 h-auto py-3 whitespace-normal text-center",
                    tier.highlighted ? "bg-personality hover:bg-personality/90" : "",
                  )}
                >
                  <Link to={tier.ctaLink}>{tier.cta}</Link>
                </Button>
              </div>
            ))}
          </div>

          {/* trust signals */}
          <div className="text-center space-y-6 border-t pt-12">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center gap-2">
                <Icon icon="shieldCheck" className="size-8 text-personality" />
                <p className="font-goudy font-700">Secure & Encrypted</p>
                <p className="text-sm text-muted-foreground">Your data is encrypted and secure</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon="creditCard" className="size-8 text-personality" />
                <p className="font-goudy font-700">No Credit Card Required</p>
                <p className="text-sm text-muted-foreground">Start your free trial today</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon="rotateCcw" className="size-8 text-personality" />
                <p className="font-goudy font-700">30-day money back</p>
                <p className="text-sm text-muted-foreground">Cancel anytime, no questions</p>
              </div>
            </div>
          </div>

          {/* faq section */}
          <div className="max-w-3xl mx-auto space-y-8 border-t pt-12">
            <h2 className="text-4xl font-basteleur font-700 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question} className="space-y-2">
                  <h3 className="text-xl font-goudy font-700">{faq.question}</h3>
                  <p className="text-muted-foreground font-goudy">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* final cta */}
          <div className="text-center space-y-6 border-t pt-12">
            <h2 className="text-4xl font-basteleur font-700">Still have questions?</h2>
            <p className="text-xl font-goudy text-muted-foreground">
              We're here to help. Get in touch with any questions.
            </p>
            <a
              href="mailto:ob248@proton.me?subject=Sprint Pricing Question"
              className="inline-block text-personality hover:underline font-goudy text-lg font-700"
            >
              Contact Us
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
