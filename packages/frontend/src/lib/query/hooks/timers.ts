import type { TimerEndRequest, TimerListItem, TimerState, TimerToggleRequest } from "@sprint/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { apiClient } from "@/lib/server";

const activeTimersQueryFn = async () => {
  const { data, error } = await apiClient.timers({ query: { activeOnly: true } });
  if (error) throw new Error(error);
  return (data ?? []) as TimerListItem[];
};

export function useActiveTimers(options?: { refetchInterval?: number; enabled?: boolean }) {
  return useQuery<TimerListItem[]>({
    queryKey: queryKeys.timers.list(),
    queryFn: activeTimersQueryFn,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
  });
}

export function useTimerState(issueId?: number | null, options?: { refetchInterval?: number }) {
  return useQuery<TimerListItem[], Error, TimerState>({
    queryKey: queryKeys.timers.list(),
    queryFn: activeTimersQueryFn,
    enabled: Boolean(issueId),
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
    select: (timers) => timers.find((timer) => timer.issueId === issueId) ?? null,
  });
}

export function useGlobalTimerState(options?: { refetchInterval?: number; enabled?: boolean }) {
  return useQuery<TimerListItem[], Error, TimerState>({
    queryKey: queryKeys.timers.list(),
    queryFn: activeTimersQueryFn,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
    select: (timers) => timers.find((timer) => timer.issueId === null) ?? null,
  });
}

export function useInactiveTimers(issueId?: number | null, options?: { refetchInterval?: number }) {
  return useQuery<TimerState[]>({
    queryKey: queryKeys.timers.inactive(issueId ?? 0),
    queryFn: async () => {
      const { data, error } = await apiClient.timerGetInactive({
        query: { issueId: issueId ?? 0 },
      });
      if (error) throw new Error(error);
      return (data ?? []) as TimerState[];
    },
    enabled: Boolean(issueId),
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
  });
}

export function useInactiveGlobalTimers(options?: { refetchInterval?: number; enabled?: boolean }) {
  return useQuery<TimerState[]>({
    queryKey: queryKeys.timers.inactiveGlobal(),
    queryFn: async () => {
      const { data, error } = await apiClient.timerGetInactiveGlobal({});
      if (error) throw new Error(error);
      return (data ?? []) as TimerState[];
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
  });
}

export function useToggleTimer() {
  const queryClient = useQueryClient();

  return useMutation<TimerState, Error, TimerToggleRequest>({
    mutationKey: ["timers", "toggle"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.timerToggle({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to toggle timer");
      return data as TimerState;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timers.inactive(variables.issueId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.timers.list() });
    },
  });
}

export function useToggleGlobalTimer() {
  const queryClient = useQueryClient();

  return useMutation<TimerState, Error, void>({
    mutationKey: ["timers", "toggle-global"],
    mutationFn: async () => {
      const { data, error } = await apiClient.timerToggleGlobal({ body: {} });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to toggle global timer");
      return data as TimerState;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timers.list() });
    },
  });
}

export function useEndTimer() {
  const queryClient = useQueryClient();

  return useMutation<TimerState, Error, TimerEndRequest>({
    mutationKey: ["timers", "end"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.timerEnd({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to end timer");
      return data as TimerState;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timers.inactive(variables.issueId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.timers.list() });
    },
  });
}

export function useEndGlobalTimer() {
  const queryClient = useQueryClient();

  return useMutation<TimerState, Error, void>({
    mutationKey: ["timers", "end-global"],
    mutationFn: async () => {
      const { data, error } = await apiClient.timerEndGlobal({ body: {} });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to end global timer");
      return data as TimerState;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timers.list() });
    },
  });
}
