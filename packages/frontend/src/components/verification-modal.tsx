import { useState } from "react";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useResendVerification, useVerifyEmail } from "@/lib/query/hooks";

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VerificationModal({ open, onOpenChange }: VerificationModalProps) {
  const { refreshUser, setEmailVerified } = useSession();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerification();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendSuccess(false);

    try {
      await verifyMutation.mutateAsync({ code: code.trim() });
      setEmailVerified(true);
      onOpenChange(false);
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendSuccess(false);

    try {
      await resendMutation.mutateAsync();
      setResendSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Verify your email</DialogTitle>
          <DialogDescription>
            We've sent a 6-digit verification code to your email. Enter it below to complete your
            registration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                disabled={verifyMutation.isPending}
                autoFocus
                className="gap-2"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-14 h-16 text-2xl" />
                  <InputOTPSlot index={1} className="w-14 h-16 text-2xl" />
                  <InputOTPSlot index={2} className="w-14 h-16 text-2xl" />
                  <InputOTPSlot index={3} className="w-14 h-16 text-2xl" />
                  <InputOTPSlot index={4} className="w-14 h-16 text-2xl" />
                  <InputOTPSlot index={5} className="w-14 h-16 text-2xl" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            {resendSuccess && <p className="text-sm text-green-600 text-center">Verification code sent!</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={code.length !== 6 || verifyMutation.isPending} className="w-full">
              {verifyMutation.isPending ? "Verifying..." : "Verify email"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleResend}
              disabled={resendMutation.isPending}
              className="w-full"
            >
              {resendMutation.isPending ? "Sending..." : "Resend code"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
