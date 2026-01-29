import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginModal } from "@/components/login-modal";
import { PricingCard, pricingTiers } from "@/components/pricing-card";
import { useSession } from "@/components/session-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import {
  useCancelSubscription,
  useCreateCheckoutSession,
  useCreatePortalSession,
  useSubscription,
} from "@/lib/query/hooks";
import { cn } from "@/lib/utils";

export default function Plans() {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [processingTier, setProcessingTier] = useState<string | null>(null);

  const { data: subscriptionData } = useSubscription();
  const createCheckoutSession = useCreateCheckoutSession();
  const createPortalSession = useCreatePortalSession();
  const cancelSubscription = useCancelSubscription();

  const subscription = subscriptionData?.subscription ?? null;
  const isProUser =
    user?.plan === "pro" || subscription?.status === "active" || subscription?.status === "trialing";
  const isCancellationScheduled = Boolean(subscription?.cancelAtPeriodEnd);
  const isCanceled = subscription?.status === "canceled";
  const cancellationEndDate = useMemo(() => {
    if (!subscription?.currentPeriodEnd) return null;
    const date = new Date(subscription.currentPeriodEnd);
    if (Number.isNaN(date.getTime())) return null;
    return format(date, "d MMM yyyy");
  }, [subscription?.currentPeriodEnd]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleTierAction = async (tierName: string) => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    if (tierName === "Pro") {
      if (isProUser) {
        // open customer portal
        setProcessingTier(tierName);
        try {
          const result = await createPortalSession.mutateAsync();
          if (result.url) {
            window.location.href = result.url;
          } else {
            setProcessingTier(null);
          }
        } catch {
          setProcessingTier(null);
        }
      } else {
        // start checkout
        setProcessingTier(tierName);
        try {
          const result = await createCheckoutSession.mutateAsync({ billingPeriod });
          if (result.url) {
            window.location.href = result.url;
          } else {
            setProcessingTier(null);
          }
        } catch {
          setProcessingTier(null);
        }
      }
    }
    // starter tier - just go to issues if not already there
    if (tierName === "Starter") {
      navigate("/issues");
    }
  };

  const handleCancelSubscription = async () => {
    setCancelError(null);
    try {
      await cancelSubscription.mutateAsync();
      setCancelDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed to cancel subscription";
      setCancelError(message);
    }
  };

  // modify pricing tiers based on user's current plan
  const modifiedTiers = pricingTiers.map((tier) => {
    const isCurrentPlan = tier.name === "Pro" && isProUser;
    const isStarterCurrent = tier.name === "Starter" && !!user && !isProUser;

    return {
      ...tier,
      highlighted: isCurrentPlan || (!isProUser && tier.name === "Pro"),
      cta: isCurrentPlan
        ? "Manage subscription"
        : isStarterCurrent
          ? "Current plan"
          : tier.name === "Pro"
            ? "Upgrade to Pro"
            : tier.cta,
    };
  });

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
            <div className="flex items-center gap-2">
              {!isLoading && user ? (
                <Button asChild variant="outline" size="sm">
                  <Link to="/issues">Open app</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setLoginModalOpen(true)}>
                  Sign in
                </Button>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-16 pt-14 px-4">
        <div className="max-w-6xl w-full space-y-16">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-basteleur font-700">
              {user ? "Choose your plan" : "Simple, transparent pricing"}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {user
                ? isProUser
                  ? "You are currently on the Pro plan. Manage your subscription or switch plans below."
                  : "You are currently on the Starter plan. Upgrade to Pro for unlimited access."
                : "Choose the plan that fits your team. Scale as you grow."}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
            {modifiedTiers.map((tier) => (
              <PricingCard
                key={tier.name}
                tier={tier}
                billingPeriod={billingPeriod}
                onCtaClick={() => handleTierAction(tier.name)}
                disabled={processingTier !== null || tier.name === "Starter"}
                loading={processingTier === tier.name}
              />
            ))}
          </div>

          {user && isProUser && (
            <div className="w-full max-w-4xl mx-auto border p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-700">Cancel subscription</p>
                  <p className="text-sm text-muted-foreground">
                    {isCancellationScheduled || isCanceled
                      ? `Cancelled, benefits end on ${cancellationEndDate ?? "your billing end date"}.`
                      : "Canceling will keep access until the end of your billing period."}
                  </p>
                </div>
                <AlertDialog
                  open={cancelDialogOpen}
                  onOpenChange={(open: boolean) => {
                    setCancelDialogOpen(open);
                    if (!open) setCancelError(null);
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={cancelSubscription.isPending || isCancellationScheduled || isCanceled}
                    >
                      {isCancellationScheduled || isCanceled
                        ? "Cancellation scheduled"
                        : "Cancel subscription"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You will keep Pro access until the end of your current billing period.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep subscription</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={handleCancelSubscription}>
                        {cancelSubscription.isPending ? "Canceling..." : "Confirm cancel"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                    {cancelError && <p className="text-sm text-destructive">{cancelError}</p>}
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {/* trust signals */}
          <div className="grid md:grid-cols-3 gap-8 w-full border-t pt-16 pb-4 max-w-4xl mx-auto">
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
              <p className="font-700">Free Starter Plan</p>
              <p className="text-sm text-muted-foreground">Get started instantly</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <Icon icon="rotateCcw" iconStyle={"pixel"} className="size-8" color="var(--personality)" />
              <p className="font-700">Money Back Guarantee</p>
              <p className="text-sm text-muted-foreground">30-day no-risk policy</p>
            </div>
          </div>

          <div className="w-full max-w-4xl mx-auto border-t pt-4 pb-2 text-center">
            <Link
              to="/the-boring-stuff"
              className="text-sm text-muted-foreground hover:text-personality transition-colors"
            >
              The boring stuff — Privacy Policy & ToS
            </Link>
          </div>
        </div>
      </main>

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
}
