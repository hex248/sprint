// import { format } from "date-fns";
import { useState } from "react";
import { Link } from "react-router-dom";
import { LoginModal } from "@/components/login-modal";
// import { PricingCard, pricingTiers } from "@/components/pricing-card";
import { useSession } from "@/components/session-provider";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
// import Icon from "@/components/ui/icon";
// import { Switch } from "@/components/ui/switch";
// import {
//   useCancelSubscription,
//   useCreateCheckoutSession,
//   useCreatePortalSession,
//   useSubscription,
// } from "@/lib/query/hooks";
// import { cn } from "@/lib/utils";

export default function Plans() {
  const { user, isLoading } = useSession();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  // const navigate = useNavigate();
  // const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  // const [processingTier, setProcessingTier] = useState<string | null>(null);

  // const { data: subscriptionData } = useSubscription();
  // const createCheckoutSession = useCreateCheckoutSession();
  // const createPortalSession = useCreatePortalSession();
  // const cancelSubscription = useCancelSubscription();

  // const subscription = subscriptionData?.subscription ?? null;
  // const isProUser =
  //   user?.plan === "pro" || subscription?.status === "active" || subscription?.status === "trialing";
  // const isCancellationScheduled = Boolean(subscription?.cancelAtPeriodEnd);
  // const isCanceled = subscription?.status === "canceled";
  // const cancellationEndDate = useMemo(() => {
  //   if (!subscription?.currentPeriodEnd) return null;
  //   const date = new Date(subscription.currentPeriodEnd);
  //   if (Number.isNaN(date.getTime())) return null;
  //   return format(date, "d MMM yyyy");
  // }, [subscription?.currentPeriodEnd]);
  // const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  // const [cancelError, setCancelError] = useState<string | null>(null);

  // const handleTierAction = async (tierName: string) => {
  //   if (!user) {
  //     setLoginModalOpen(true);
  //     return;
  //   }
  //
  //   if (tierName === "Pro") {
  //     if (isProUser) {
  //       // open customer portal
  //       setProcessingTier(tierName);
  //       try {
  //         const result = await createPortalSession.mutateAsync();
  //         if (result.url) {
  //           window.location.href = result.url;
  //         } else {
  //           setProcessingTier(null);
  //         }
  //       } catch {
  //         setProcessingTier(null);
  //       }
  //     } else {
  //       // start checkout
  //       setProcessingTier(tierName);
  //       try {
  //         const result = await createCheckoutSession.mutateAsync({ billingPeriod });
  //         if (result.url) {
  //           window.location.href = result.url;
  //         } else {
  //           setProcessingTier(null);
  //         }
  //       } catch {
  //         setProcessingTier(null);
  //       }
  //     }
  //   }
  //   // starter tier - just go to issues if not already there
  //   if (tierName === "Starter") {
  //     navigate("/issues");
  //   }
  // };

  // const handleCancelSubscription = async () => {
  //   setCancelError(null);
  //   try {
  //     await cancelSubscription.mutateAsync();
  //     setCancelDialogOpen(false);
  //   } catch (error) {
  //     const message = error instanceof Error ? error.message : "failed to cancel subscription";
  //     setCancelError(message);
  //   }
  // };

  // const modifiedTiers = pricingTiers.map((tier) => {
  //   const isCurrentPlan = tier.name === "Pro" && isProUser;
  //   const isStarterCurrent = tier.name === "Starter" && !!user && !isProUser;
  //
  //   return {
  //     ...tier,
  //     highlighted: isCurrentPlan || (!isProUser && tier.name === "Pro"),
  //     cta: isCurrentPlan
  //       ? "Manage subscription"
  //       : isStarterCurrent
  //         ? "Current plan"
  //         : tier.name === "Pro"
  //           ? "Upgrade to Pro"
  //           : tier.cta,
  //   };
  // });

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
        {/* pricing content commented out for beta */}
      </main>

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
}
