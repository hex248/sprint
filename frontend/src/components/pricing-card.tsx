import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export interface PricingTier {
  name: string;
  price: string;
  priceAnnual: string;
  period: string;
  periodAnnual: string;
  description: string;
  tagline: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

export function PricingCard({
  tier,
  billingPeriod,
  onCtaClick,
  disabled = false,
  loading = false,
}: {
  tier: PricingTier;
  billingPeriod: "monthly" | "annual";
  onCtaClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div
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
            <Icon icon="check" iconStyle={"pixel"} className="size-6 -mt-0.5" color="var(--personality)" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={tier.highlighted ? "default" : "outline"}
        className={cn(
          "font-700 py-6",
          tier.highlighted ? "bg-personality hover:bg-personality/90 text-background" : "",
        )}
        onClick={onCtaClick}
        disabled={disabled}
      >
        {loading ? "Processing..." : tier.cta}
      </Button>
    </div>
  );
}

export const pricingTiers: PricingTier[] = [
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
      "5 sprints",
      "100 issues",
      "Up to 5 team members",
      "Static avatars only",
      "Pixel icon style",
      "Email support",
    ],
    cta: "Get started free",
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
      "Unlimited sprints",
      "Unlimited issues",
      "Animated avatars",
      "Custom icon styles",
      "Feature toggling",
      "Advanced time tracking & reports",
      "Custom issue statuses",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
];
