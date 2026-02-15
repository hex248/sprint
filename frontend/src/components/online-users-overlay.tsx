import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { CallRoomOverlay } from "@/components/call-room-overlay";
import { useSelection } from "@/components/selection-provider";
import { useSessionSafe } from "@/components/session-provider";
import SmallUserDisplay from "@/components/small-user-display";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { DEFAULT_RTC_ICE_SERVERS, useOrganisationMembers, useRtcConfig } from "@/lib/query/hooks";
import { useRoomAudio } from "@/lib/rtc/use-room-audio";
import { getServerURL } from "@/lib/utils";

const RECONNECT_DELAY_MS = 2000;

type PresenceMessage = {
  type: "online-users";
  organisationId: number;
  userIds: number[];
  inCallUserIds: number[];
  inCallRoomOwnerUserIds: number[];
};

type RoomParticipantsMessage = {
  type: "room-participants";
  organisationId: number;
  roomUserId: number;
  participantUserIds: number[];
};

type RoomJoinedMessage = {
  type: "room-joined";
  organisationId: number;
  roomUserId: number;
};

type RoomErrorMessage = {
  type: "room-error";
  code: "INVALID_ROOM" | "FORBIDDEN_ROOM" | "IN_CALL" | "SIGNAL_INVALID";
  message: string;
};

type RoomUserJoinedMessage = {
  type: "room-user-joined";
  organisationId: number;
  roomUserId: number;
  userId: number;
};

type PresenceSocketMessage =
  | PresenceMessage
  | RoomParticipantsMessage
  | RoomJoinedMessage
  | RoomErrorMessage
  | RoomUserJoinedMessage;

export function OnlineUsersOverlay() {
  const location = useLocation();
  const session = useSessionSafe();
  const { selectedOrganisationId } = useSelection();
  const { data: membersData = [] } = useOrganisationMembers(selectedOrganisationId);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [inCallUserIds, setInCallUserIds] = useState<number[]>([]);
  const [inCallRoomOwnerUserIds, setInCallRoomOwnerUserIds] = useState<number[]>([]);
  const [currentRoomUserId, setCurrentRoomUserId] = useState<number | null>(null);
  const [roomParticipantUserIds, setRoomParticipantUserIds] = useState<number[]>([]);
  const [desiredRoomUserId, setDesiredRoomUserId] = useState<number | null>(null);
  const [socketOpen, setSocketOpen] = useState(false);
  const [socketState, setSocketState] = useState<WebSocket | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const desiredRoomUserIdRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isSupportedRoute =
    location.pathname.startsWith("/issues") || location.pathname.startsWith("/timeline");
  const rtcConfigEnabled = Boolean(isSupportedRoute && session?.user && selectedOrganisationId);
  const { data: rtcIceServers = DEFAULT_RTC_ICE_SERVERS } = useRtcConfig(rtcConfigEnabled);

  useEffect(() => {
    desiredRoomUserIdRef.current = desiredRoomUserId;
  }, [desiredRoomUserId]);

  const rtc = useRoomAudio({
    socket: socketState,
    socketOpen,
    organisationId: selectedOrganisationId ?? 0,
    sessionUserId: session?.user?.id ?? 0,
    roomUserId: currentRoomUserId,
    participantUserIds: roomParticipantUserIds,
    iceServers: rtcIceServers,
  });

  const rtcHandlerRef = useRef(rtc.handleWsMessage);
  useEffect(() => {
    rtcHandlerRef.current = rtc.handleWsMessage;
  }, [rtc.handleWsMessage]);

  const isRtcType = (msg: unknown): boolean => {
    if (!msg || typeof msg !== "object" || !("type" in msg)) {
      return false;
    }
    const type = (msg as { type?: unknown }).type;
    return (
      type === "webrtc-offer" ||
      type === "webrtc-answer" ||
      type === "webrtc-ice-candidate" ||
      type === "webrtc-peer-state"
    );
  };

  const sendJoinRoom = useCallback((roomUserId: number) => {
    setDesiredRoomUserId(roomUserId);

    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "join-room",
        roomUserId,
      }),
    );
  }, []);

  const playBloop = useCallback(() => {
    try {
      const webAudioWindow = window as Window & {
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextConstructor = window.AudioContext ?? webAudioWindow.webkitAudioContext;
      if (!AudioContextConstructor) {
        return;
      }

      const audioContext = audioContextRef.current ?? new AudioContextConstructor();
      audioContextRef.current = audioContext;

      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(660, now);
      oscillator.frequency.exponentialRampToValueAtTime(920, now + 0.12);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.2);
    } catch {
      return;
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (!session?.user) {
      return;
    }

    setDesiredRoomUserId(session.user.id);
    setCurrentRoomUserId(session.user.id);
    setRoomParticipantUserIds([session.user.id]);

    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "leave-room",
      }),
    );
  }, [session?.user]);

  const endRoom = useCallback(() => {
    if (!session?.user || currentRoomUserId !== session.user.id) {
      return;
    }

    setDesiredRoomUserId(session.user.id);
    setCurrentRoomUserId(session.user.id);
    setRoomParticipantUserIds([session.user.id]);

    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "end-room",
      }),
    );
  }, [currentRoomUserId, session?.user]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (!isSupportedRoute || !session?.user || !selectedOrganisationId) {
      setOnlineUserIds([]);
      setInCallUserIds([]);
      setInCallRoomOwnerUserIds([]);
      setCurrentRoomUserId(null);
      setRoomParticipantUserIds([]);
      setDesiredRoomUserId(null);
      setSocketOpen(false);
      setSocketState(null);
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    const sessionUserId = session.user.id;

    let socket: WebSocket | null = null;
    let reconnectTimeout: number | null = null;
    let isCancelled = false;

    const connect = () => {
      if (isCancelled) {
        return;
      }

      const socketURL = new URL(`${getServerURL()}/organisation/ws`);
      socketURL.searchParams.set("organisationId", `${selectedOrganisationId}`);
      socketURL.protocol = socketURL.protocol === "https:" ? "wss:" : "ws:";

      socket = new WebSocket(socketURL.toString());
      socketRef.current = socket;
      setSocketState(socket);

      socket.onopen = () => {
        setSocketOpen(true);
        const targetRoomUserId = desiredRoomUserIdRef.current;
        if (targetRoomUserId == null || targetRoomUserId === sessionUserId) {
          return;
        }

        socket?.send(
          JSON.stringify({
            type: "join-room",
            roomUserId: targetRoomUserId,
          }),
        );
      };

      socket.onmessage = (event) => {
        try {
          const unknownMessage = JSON.parse(event.data) as unknown;
          if (isRtcType(unknownMessage)) {
            rtcHandlerRef.current(unknownMessage);
            return;
          }

          const message = unknownMessage as PresenceSocketMessage;

          if (message.type === "online-users") {
            if (message.organisationId !== selectedOrganisationId) {
              return;
            }

            const nextUserIds = message.userIds.filter((userId) => Number.isInteger(userId) && userId > 0);
            setOnlineUserIds(nextUserIds);
            const nextInCallUserIds = message.inCallUserIds.filter(
              (userId) => Number.isInteger(userId) && userId > 0,
            );
            setInCallUserIds(nextInCallUserIds);
            const nextInCallRoomOwnerUserIds = message.inCallRoomOwnerUserIds.filter(
              (userId) => Number.isInteger(userId) && userId > 0,
            );
            setInCallRoomOwnerUserIds(nextInCallRoomOwnerUserIds);
            return;
          }

          if (message.type === "room-user-joined") {
            if (message.organisationId !== selectedOrganisationId) {
              return;
            }

            playBloop();
            return;
          }

          if (message.type === "room-participants") {
            if (message.organisationId !== selectedOrganisationId) {
              return;
            }

            setCurrentRoomUserId(message.roomUserId);
            const nextParticipantIds = message.participantUserIds.filter(
              (userId) => Number.isInteger(userId) && userId > 0,
            );
            setRoomParticipantUserIds(nextParticipantIds);
            return;
          }

          if (message.type === "room-joined") {
            if (message.organisationId !== selectedOrganisationId) {
              return;
            }
            setCurrentRoomUserId(message.roomUserId);
          }
        } catch {
          return;
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        socketRef.current = null;
        setSocketOpen(false);
        setSocketState(null);
        if (isCancelled) {
          return;
        }

        reconnectTimeout = window.setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      isCancelled = true;
      if (reconnectTimeout != null) {
        window.clearTimeout(reconnectTimeout);
      }
      socket?.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      setSocketOpen(false);
      setSocketState(null);
    };
  }, [isSupportedRoute, playBloop, selectedOrganisationId, session?.user]);

  const onlineMembers = useMemo(() => {
    if (onlineUserIds.length === 0) {
      return [];
    }

    const onlineSet = new Set(onlineUserIds);
    return membersData
      .filter((member) => onlineSet.has(member.User.id))
      .sort((a, b) => a.User.name.localeCompare(b.User.name));
  }, [membersData, onlineUserIds]);

  const otherOnlineMembers = useMemo(
    () => onlineMembers.filter((member) => member.User.id !== session?.user?.id),
    [onlineMembers, session?.user?.id],
  );

  const membersById = useMemo(
    () => new Map(membersData.map((member) => [member.User.id, member.User] as const)),
    [membersData],
  );

  const roomParticipants = useMemo(
    () => roomParticipantUserIds.map((userId) => membersById.get(userId)).filter((user) => user != null),
    [membersById, roomParticipantUserIds],
  );

  const roomOwner = useMemo(
    () => (currentRoomUserId == null ? null : (membersById.get(currentRoomUserId) ?? null)),
    [currentRoomUserId, membersById],
  );

  const roomParticipantSet = useMemo(() => new Set(roomParticipantUserIds), [roomParticipantUserIds]);
  const inCallUserSet = useMemo(() => new Set(inCallUserIds), [inCallUserIds]);
  const inCallRoomOwnerUserSet = useMemo(() => new Set(inCallRoomOwnerUserIds), [inCallRoomOwnerUserIds]);

  if (!isSupportedRoute || !session?.user || !selectedOrganisationId) {
    return null;
  }

  const isRoomOwner = currentRoomUserId === session.user.id;
  const viewerIsInCall = inCallUserSet.has(session.user.id);

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-50 flex w-[min(32rem,calc(100vw-2rem))] flex-col gap-2">
      <CallRoomOverlay
        participants={roomParticipants}
        roomOwner={roomOwner}
        isRoomOwner={isRoomOwner}
        selfUserId={session.user.id}
        localMuted={rtc.localMuted}
        localSpeaking={rtc.localSpeaking}
        micError={rtc.micError}
        remoteMuted={rtc.remoteMuted}
        remoteSpeaking={rtc.remoteSpeaking}
        remoteStreams={rtc.remoteStreams}
        onToggleMute={rtc.toggleMuted}
        onRetryMic={rtc.retryMic}
        onLeave={leaveRoom}
        onEnd={endRoom}
      />

      {otherOnlineMembers.length > 0 && (
        <div className="w-fit self-end border bg-background/95 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            {otherOnlineMembers.length} Online user{otherOnlineMembers.length !== 1 ? "s" : ""}
          </p>
          <div className="mt-2 flex max-h-56 flex-col gap-2 overflow-y-auto">
            {otherOnlineMembers.map((member) => (
              <div key={member.User.id} className="flex items-center justify-between gap-2">
                <SmallUserDisplay
                  user={member.User}
                  className={
                    roomParticipantSet.has(member.User.id) || inCallUserSet.has(member.User.id)
                      ? "min-w-0 text-sm text-destructive"
                      : "min-w-0 text-sm"
                  }
                />
                <div className="flex items-center gap-2">
                  {!roomParticipantSet.has(member.User.id) &&
                    !viewerIsInCall &&
                    (!inCallUserSet.has(member.User.id) || inCallRoomOwnerUserSet.has(member.User.id)) && (
                      <IconButton
                        size="sm"
                        variant="outline"
                        aria-label={`nudge ${member.User.name}`}
                        onClick={() => sendJoinRoom(member.User.id)}
                      >
                        <Icon icon="handsUp" className="size-3.5" />
                      </IconButton>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
