import type { UserResponse } from "@sprint/shared";
import Avatar from "@/components/avatar";
import { Button } from "@/components/ui/button";

type CallRoomOverlayProps = {
  participants: UserResponse[];
  roomOwner: UserResponse | null;
  isRoomOwner: boolean;
  onLeave: () => void;
  onEnd: () => void;
};

export function CallRoomOverlay({
  participants,
  roomOwner,
  isRoomOwner,
  onLeave,
  onEnd,
}: CallRoomOverlayProps) {
  if (participants.length < 2) {
    return null;
  }

  return (
    <div className="w-full border bg-background/95 p-2 shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium">
          {roomOwner ? `${roomOwner.name}'s room` : "Connected room"}
        </p>
        <Button variant="outline" size="sm" onClick={isRoomOwner ? onEnd : onLeave}>
          {isRoomOwner ? "End" : "Leave"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {participants.map((participant) => (
          <div key={participant.id} className="min-w-0 flex-1 basis-28 border bg-muted/40 p-2">
            <div className="mb-2 flex justify-center">
              <Avatar
                name={participant.name}
                username={participant.username}
                avatarURL={participant.avatarURL}
                size={12}
                textClass="text-sm"
              />
            </div>
            <p className="truncate text-center text-xs">{participant.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
