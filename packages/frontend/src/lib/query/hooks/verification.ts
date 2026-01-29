import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/server";

export function useVerifyEmail() {
  return useMutation<void, Error, { code: string }>({
    mutationKey: ["verification", "verify"],
    mutationFn: async ({ code }) => {
      const { error } = await apiClient.authVerifyEmail({ body: { code } });
      if (error) throw new Error(error);
    },
  });
}

export function useResendVerification() {
  return useMutation<void, Error>({
    mutationKey: ["verification", "resend"],
    mutationFn: async () => {
      const { error } = await apiClient.authResendVerification({ body: {} });
      if (error) throw new Error(error);
    },
  });
}
