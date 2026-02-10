import type {
  CancelSubscriptionResponse,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  CreatePortalSessionResponse,
  GetSubscriptionResponse,
} from "@sprint/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { apiClient } from "@/lib/server";

export function useSubscription() {
  return useQuery<GetSubscriptionResponse>({
    queryKey: queryKeys.subscription.current(),
    queryFn: async () => {
      const { data, error } = await apiClient.subscriptionGet();
      if (error) throw new Error(error);
      return (data ?? { subscription: null }) as GetSubscriptionResponse;
    },
  });
}

export function useCreateCheckoutSession() {
  return useMutation<CreateCheckoutSessionResponse, Error, CreateCheckoutSessionRequest>({
    mutationKey: ["subscription", "checkout"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.subscriptionCreateCheckoutSession({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to create checkout session");
      return data as CreateCheckoutSessionResponse;
    },
  });
}

export function useCreatePortalSession() {
  return useMutation<CreatePortalSessionResponse, Error>({
    mutationKey: ["subscription", "portal"],
    mutationFn: async () => {
      const { data, error } = await apiClient.subscriptionCreatePortalSession({ body: {} });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to create portal session");
      return data as CreatePortalSessionResponse;
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation<CancelSubscriptionResponse, Error>({
    mutationKey: ["subscription", "cancel"],
    mutationFn: async () => {
      const { data, error } = await apiClient.subscriptionCancel({ body: {} });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to cancel subscription");
      return data as CancelSubscriptionResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.current() });
    },
  });
}
