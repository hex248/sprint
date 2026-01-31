import type { ChatRequest, ChatResponse, ModelsResponse } from "@sprint/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/server";

export function useChat() {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationKey: ["ai", "chat"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.aiChat({ query: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to get chat response");
      return data as ChatResponse;
    },
  });
}

export function useModels(enabled: boolean) {
  return useQuery<ModelsResponse, Error>({
    queryKey: ["ai", "models"],
    queryFn: async () => {
      const { data, error } = await apiClient.aiModels();
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to get models");
      return data as ModelsResponse;
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
