import type { TimerEndRequest, TimerListItem, TimerState, TimerToggleRequest } from "@sprint/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelection } from "@/components/selection-provider";
import { queryKeys } from "@/lib/query/keys";
import { apiClient } from "@/lib/server";

const activeTimersQueryFn = async (organisationId: number) => {
  const { data, error } = await apiClient.timers({ query: { activeOnly: true, organisationId } });
  if (error) throw new Error(error);
  return (data ?? []) as TimerListItem[];
};

export function useActiveTimers(options?: { refetchInterval?: number; enabled?: boolean }) {
  const { selectedOrganisationId } = useSelection();

  return useQuery<TimerListItem[]>({
    queryKey: queryKeys.timers.list(selectedOrganisationId ?? 0),
    queryFn: () => activeTimersQueryFn(selectedOrganisationId ?? 0),
    enabled: (options?.enabled ?? true) && Boolean(selectedOrganisationId),
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
  });
}

export function useTimerState(issueId?: number | null, options?: { refetchInterval?: number }) {
  const { selectedOrganisationId } = useSelection();

  return useQuery<TimerListItem[], Error, TimerState>({
    queryKey: queryKeys.timers.list(selectedOrganisationId ?? 0),
    queryFn: () => activeTimersQueryFn(selectedOrganisationId ?? 0),
    enabled: Boolean(issueId && selectedOrganisationId),
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
    select: (timers) => timers.find((timer) => timer.issueId === issueId) ?? null,
  });
}

export function useGlobalTimerState(options?: { refetchInterval?: number; enabled?: boolean }) {
  const { selectedOrganisationId } = useSelection();

  return useQuery<TimerListItem[], Error, TimerState>({
    queryKey: queryKeys.timers.list(selectedOrganisationId ?? 0),
    queryFn: () => activeTimersQueryFn(selectedOrganisationId ?? 0),
    enabled: (options?.enabled ?? true) && Boolean(selectedOrganisationId),
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
  const { selectedOrganisationId } = useSelection();

  return useQuery<TimerState[]>({
    queryKey: queryKeys.timers.inactiveGlobal(selectedOrganisationId ?? 0),
    queryFn: async () => {
      const { data, error } = await apiClient.timerGetInactiveGlobal({
        query: { organisationId: selectedOrganisationId ?? 0 },
      });
      if (error) throw new Error(error);
      return (data ?? []) as TimerState[];
    },
    enabled: (options?.enabled ?? true) && Boolean(selectedOrganisationId),
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
  });
}

export function useToggleTimer() {
  const queryClient = useQueryClient();
  const { selectedOrganisationId } = useSelection();

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
      if (selectedOrganisationId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.timers.inactiveGlobal(selectedOrganisationId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.timers.list(selectedOrganisationId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.timers.all });
    },
  });
}

export function useToggleGlobalTimer() {
  const queryClient = useQueryClient();
  const { selectedOrganisationId } = useSelection();

  return useMutation<TimerState, Error, void>({
    mutationKey: ["timers", "toggle-global"],
    mutationFn: async () => {
      if (!selectedOrganisationId) {
        throw new Error("select an organisation first");
      }

      const { data, error } = await apiClient.timerToggleGlobal({
        body: { organisationId: selectedOrganisationId },
      });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to toggle global timer");
      return data as TimerState;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timers.all });
    },
  });
}

export function useEndTimer() {
  const queryClient = useQueryClient();
  const { selectedOrganisationId } = useSelection();

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
      if (selectedOrganisationId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.timers.list(selectedOrganisationId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.timers.all });
    },
  });
}

export function useEndGlobalTimer() {
  const queryClient = useQueryClient();
  const { selectedOrganisationId } = useSelection();

  return useMutation<TimerState, Error, void>({
    mutationKey: ["timers", "end-global"],
    mutationFn: async () => {
      if (!selectedOrganisationId) {
        throw new Error("select an organisation first");
      }

      const { data, error } = await apiClient.timerEndGlobal({
        body: { organisationId: selectedOrganisationId },
      });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to end global timer");
      return data as TimerState;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timers.all });
    },
  });
}
