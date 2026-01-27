import { useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "@/components/session-provider";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const pricingTiers = [
  {
    name: "Starter",
    price: "£0",
    priceAnnual: "£0",
    period: "Free forever",
    periodAnnual: "Free forever",
    description: "Perfect for side projects and solo developers",
    tagline: "For solo devs and small projects",
    features: [
      "1 organisation (owned or joined)",
      "1 project",
      "100 issues",
      "Up to 5 team members",
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
      "Custom issue statuses",
      "Priority email support",
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

export default function Landing() {
  const { user, isLoading } = useSession();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="min-h-screen flex flex-col" id="top">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="w-full flex h-14 items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Sprint" className="size-12 -mt-0.5" />
            <span className="text-3xl font-basteleur font-700 transition-colors -mt-0.5">Sprint</span>
          </div>
          <nav className="flex items-center gap-6">
            <a
              href="#top"
              className="hidden md:block text-sm font-500 hover:text-personality transition-colors"
            >
              Home
            </a>
            <a
              href="#features"
              className="hidden md:block text-sm font-500 hover:text-personality transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="hidden md:block text-sm font-500 hover:text-personality transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="hidden md:block text-sm font-500 hover:text-personality transition-colors"
            >
              FAQ
            </a>
            <div className="flex items-center gap-2">
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
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-16 pt-14 px-4">
        <div className="max-w-6xl w-full space-y-18">
          {/* hero section */}
          <div className="text-center space-y-8">
            <div className="flex justify-center mb-8">
              <img src="/favicon.svg" alt="Sprint" className="size-48" />
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
                    <a href="#pricing">See pricing</a>
                  </Button>
                </>
              )}
            </div>

            <p className="text-sm text-muted-foreground">No credit card required · Full access for 14 days</p>
          </div>

          {/* problem section */}
          <div className="max-w-4xl mx-auto space-y-16">
            <h2 className="text-4xl font-basteleur font-700 text-center">
              Tired of spending more time managing Jira than building products?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Icon
                  icon="timerOff"
                  iconStyle={"pixel"}
                  className="size-16 mx-auto"
                  color={"var(--muted-foreground)"}
                />
                <p className="text-center text-muted-foreground">
                  Wasting hours configuring workflows instead of shipping features
                </p>
              </div>
              <div className="space-y-2">
                <Icon
                  icon="gridAdd"
                  iconStyle={"pixel"}
                  className="size-16 mx-auto"
                  color={"var(--muted-foreground)"}
                />
                <p className="text-center text-muted-foreground">
                  Drowning in features you'll never use while missing the basics
                </p>
              </div>
              <div className="space-y-2">
                <Icon
                  icon="bugOff"
                  iconStyle={"pixel"}
                  className="size-16 mx-auto"
                  color={"var(--muted-foreground)"}
                />
                <p className="text-center text-muted-foreground">
                  The software is full of bugs. Your flow state doesn't stand a chance
                </p>
              </div>
            </div>
          </div>

          {/* solution section */}
          <div id="features" className="max-w-5xl mx-auto space-y-12 scroll-mt-4 border-t pt-24">
            <h2 className="text-5xl font-basteleur font-700 text-center">
              Everything you need, nothing you don't
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border p-8 space-y-4">
                <Icon
                  icon="layoutDashboard"
                  iconStyle={"pixel"}
                  className="size-10"
                  color={"var(--personality)"}
                />
                <h3 className="text-2xl font-basteleur font-700">See your work at a glance</h3>
                <p className="text-muted-foreground text-lg">
                  Beautiful, intuitive issue tracking with customizable statuses. Organize by projects and
                  sprints. Find what you need in seconds, not minutes.
                </p>
              </div>

              <div className="border p-8 space-y-4">
                <Icon icon="timer" iconStyle={"pixel"} className="size-10" color={"var(--personality)"} />
                <h3 className="text-2xl font-basteleur font-700">Track time without thinking</h3>
                <p className="text-muted-foreground text-lg">
                  Built-in time tracking that actually works. Start, pause, resume. See where your time goes
                  without juggling another tool.
                </p>
              </div>

              <div className="border p-8 space-y-4">
                <Icon icon="rocket" iconStyle={"pixel"} className="size-10" color={"var(--personality)"} />
                <h3 className="text-2xl font-basteleur font-700">Ship in sprints</h3>
                <p className="text-muted-foreground text-lg">
                  Sprint planning that actually works. Set date ranges, assign issues, track velocity. Keep
                  your team aligned without the ceremony.
                </p>
              </div>

              <div className="border p-8 space-y-4">
                <Icon icon="checkBox" iconStyle={"pixel"} className="size-10" color={"var(--personality)"} />
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
                "Native desktop app (Tauri)",
                "Clean, resizable interface",
                "Issue assignment and collaboration",
                "Individual feature toggles (org level)",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <Icon icon="check" iconStyle={"pixel"} className="size-6" color={"var(--personality)"} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* pricing section */}
          <div
            id="pricing"
            className="max-w-5xl mx-auto space-y-16 flex flex-col items-center border-t pt-24 scroll-mt-4"
          >
            <div className="text-center space-y-6">
              <h2 className="text-5xl font-basteleur font-700">Simple, transparent pricing</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that fits your team. Scale as you grow.
              </p>

              {/* billing toggle */}
              <div className="flex items-center justify-center gap-4 pt-4">
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
                <Switch
                  size="lg"
                  checked={billingPeriod === "annual"}
                  onCheckedChange={(checked) => setBillingPeriod(checked ? "annual" : "monthly")}
                  className="bg-border data-[state=checked]:bg-border! data-[state=unchecked]:bg-border!"
                  thumbClassName="bg-personality dark:bg-personality data-[state=checked]:bg-personality! data-[state=unchecked]:bg-personality!"
                  aria-label="toggle billing period"
                />
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
                <span className="text-sm px-3 py-1 bg-personality/10 text-personality rounded-full font-600">
                  Save 17%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={cn(
                    "flex flex-col border p-8 space-y-6 relative",
                    tier.highlighted ? "border-2 border-personality shadow-lg scale-105" : "border-border",
                  )}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-4 left-4 bg-personality text-background px-3 py-1 text-xs font-700">
                      {tier.tagline}
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-3xl font-basteleur font-700">{tier.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-700">
                        {billingPeriod === "annual" ? tier.priceAnnual : tier.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {billingPeriod === "annual" ? tier.periodAnnual : tier.period}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{tier.description}</p>
                  </div>

                  <ul className="space-y-3 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Icon
                          icon="check"
                          iconStyle={"pixel"}
                          className="size-6 -mt-0.5"
                          color="var(--personality)"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    variant={tier.highlighted ? "default" : "outline"}
                    className={cn(
                      "font-700 py-6",
                      tier.highlighted ? "bg-personality hover:bg-personality/90 text-background" : "",
                    )}
                  >
                    <Link to={tier.ctaLink}>{tier.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>

            {/* trust signals */}
            <div className="grid md:grid-cols-3 gap-8 w-full border-t pt-16 pb-8">
              <div className="flex flex-col items-center text-center gap-2">
                <Icon icon="eyeClosed" iconStyle={"pixel"} className="size-8" color="var(--personality)" />
                <p className="font-700">Secure & Encrypted</p>
                <p className="text-sm text-muted-foreground">Your data is safe with us</p>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Icon
                  icon="creditCardDelete"
                  iconStyle={"pixel"}
                  className="size-8"
                  color="var(--personality)"
                />
                <p className="font-700">No Card Required</p>
                <p className="text-sm text-muted-foreground">Start your trial instantly</p>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Icon icon="rotateCcw" iconStyle={"pixel"} className="size-8" color="var(--personality)" />
                <p className="font-700">Money Back Guarantee</p>
                <p className="text-sm text-muted-foreground">30-day no-risk policy</p>
              </div>
            </div>

            {/* faq section */}
            <div className="w-full max-w-5xl flex justify-center border-t pt-24 scroll-mt-4" id="faq">
              <div className="w-full max-w-4xl flex flex-col items-center space-y-12">
                <h2 className="text-5xl font-basteleur font-700 text-center">Frequently Asked Questions</h2>
                <div className="grid gap-8 max-w-3xl">
                  {faqs.map((faq) => (
                    <div key={faq.question} className="space-y-2">
                      <h4 className="text-lg font-700">{faq.question}</h4>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TODO:> commented out until we have actual testimonies */}
          {/* social proof placeholder */}
          {/* <div className="max-w-4xl mx-auto text-center space-y-8">
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
          </div> */}

          {/* final cta */}
          <div className="max-w-5xl mx-auto text-center space-y-6 border-t pt-16">
            <h2 className="text-5xl font-basteleur font-700">Ready to ship faster?</h2>
            <p className="text-xl text-muted-foreground">
              Start tracking issues, managing sprints, and shipping products in minutes
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
