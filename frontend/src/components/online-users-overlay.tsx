import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { CallRoomOverlay } from "@/components/call-room-overlay";
import { useSelection } from "@/components/selection-provider";
import { useSessionSafe } from "@/components/session-provider";
import SmallUserDisplay from "@/components/small-user-display";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { useOrganisationMembers } from "@/lib/query/hooks";
import { getServerURL } from "@/lib/utils";

const RECONNECT_DELAY_MS = 2000;

type PresenceMessage = {
  type: "online-users";
  organisationId: number;
  userIds: number[];
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
  code: "INVALID_ROOM" | "FORBIDDEN_ROOM";
  message: string;
};

type PresenceSocketMessage = PresenceMessage | RoomParticipantsMessage | RoomJoinedMessage | RoomErrorMessage;

export function OnlineUsersOverlay() {
  const location = useLocation();
  const session = useSessionSafe();
  const { selectedOrganisationId } = useSelection();
  const { data: membersData = [] } = useOrganisationMembers(selectedOrganisationId);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [currentRoomUserId, setCurrentRoomUserId] = useState<number | null>(null);
  const [roomParticipantUserIds, setRoomParticipantUserIds] = useState<number[]>([]);
  const [desiredRoomUserId, setDesiredRoomUserId] = useState<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const desiredRoomUserIdRef = useRef<number | null>(null);
  const isSupportedRoute =
    location.pathname.startsWith("/issues") || location.pathname.startsWith("/timeline");

  useEffect(() => {
    desiredRoomUserIdRef.current = desiredRoomUserId;
  }, [desiredRoomUserId]);

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

  useEffect(() => {
    if (!isSupportedRoute || !session?.user || !selectedOrganisationId) {
      setOnlineUserIds([]);
      setCurrentRoomUserId(null);
      setRoomParticipantUserIds([]);
      setDesiredRoomUserId(null);
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

      socket.onopen = () => {
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
          const message = JSON.parse(event.data) as PresenceSocketMessage;

          if (message.type === "online-users") {
            if (message.organisationId !== selectedOrganisationId) {
              return;
            }

            const nextUserIds = message.userIds.filter((userId) => Number.isInteger(userId) && userId > 0);
            setOnlineUserIds(nextUserIds);
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
    };
  }, [isSupportedRoute, selectedOrganisationId, session?.user]);

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

  if (!isSupportedRoute || !session?.user || !selectedOrganisationId) {
    return null;
  }

  const isRoomOwner = currentRoomUserId === session.user.id;

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-50 flex w-[min(32rem,calc(100vw-2rem))] flex-col gap-2">
      <CallRoomOverlay
        participants={roomParticipants}
        roomOwner={roomOwner}
        isRoomOwner={isRoomOwner}
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
                <SmallUserDisplay user={member.User} className="min-w-0 text-sm" />
                <IconButton
                  size="sm"
                  variant="outline"
                  aria-label={`nudge ${member.User.name}`}
                  onClick={() => sendJoinRoom(member.User.id)}
                >
                  <Icon icon="handsUp" className="size-3.5" />
                </IconButton>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
