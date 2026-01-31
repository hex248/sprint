import type { ChatRequest, ChatResponse } from "@sprint/shared";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/server";

export function useChatMutation() {
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
