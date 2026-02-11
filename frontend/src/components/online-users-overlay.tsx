import { useEffect, useMemo, useState } from "react";
import { useSelection } from "@/components/selection-provider";
import { useSessionSafe } from "@/components/session-provider";
import SmallUserDisplay from "@/components/small-user-display";
import { useOrganisationMembers } from "@/lib/query/hooks";
import { getServerURL } from "@/lib/utils";

const RECONNECT_DELAY_MS = 2000;

type PresenceMessage = {
  type: "online-users";
  organisationId: number;
  userIds: number[];
};

export function OnlineUsersOverlay() {
  const session = useSessionSafe();
  const { selectedOrganisationId } = useSelection();
  const { data: membersData = [] } = useOrganisationMembers(selectedOrganisationId);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

  useEffect(() => {
    if (!session?.user || !selectedOrganisationId) {
      setOnlineUserIds([]);
      return;
    }

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

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as PresenceMessage;
          if (message.type !== "online-users" || message.organisationId !== selectedOrganisationId) {
            return;
          }

          const nextUserIds = message.userIds.filter((userId) => Number.isInteger(userId) && userId > 0);
          setOnlineUserIds(nextUserIds);
        } catch {
          return;
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
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
    };
  }, [selectedOrganisationId, session?.user]);

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

  if (!session?.user || !selectedOrganisationId || otherOnlineMembers.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-50 border bg-background/95 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        {otherOnlineMembers.length} Online user{otherOnlineMembers.length !== 1 ? "s" : ""}
      </p>
      <div className="mt-2 flex max-h-56 flex-col gap-2 overflow-y-auto">
        {otherOnlineMembers.map((member) => (
          <SmallUserDisplay key={member.User.id} user={member.User} className="text-sm" />
        ))}
      </div>
    </div>
  );
}
