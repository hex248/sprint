import type { RtcConfigResponse } from "@sprint/shared";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/server";

export const DEFAULT_RTC_ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

function toClientIceServer(server: RtcConfigResponse["iceServers"][number]): RTCIceServer {
  return {
    urls: server.urls,
    username: server.username,
    credential: server.credential,
  };
}

export function useRtcConfig(enabled: boolean) {
  return useQuery<RTCIceServer[]>({
    queryKey: ["rtc", "config"],
    queryFn: async () => {
      const { data, error } = await apiClient.rtcConfig();
      if (error) throw new Error(error);
      if (!data) return DEFAULT_RTC_ICE_SERVERS;

      const response = data as RtcConfigResponse;
      if (!Array.isArray(response.iceServers) || response.iceServers.length === 0) {
        return DEFAULT_RTC_ICE_SERVERS;
      }

      return response.iceServers.map(toClientIceServer);
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
