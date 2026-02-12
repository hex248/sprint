import type { UserResponse } from "@sprint/shared";
import { useEffect, useRef } from "react";
import Avatar from "@/components/avatar";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    el.srcObject = stream;
    void el.play().catch(() => undefined);
  }, [stream]);

  // biome-ignore lint/a11y/useMediaCaption: <live audio>
  return <audio ref={ref} autoPlay playsInline className="hidden" />;
}

type CallRoomOverlayProps = {
  participants: UserResponse[];
  roomOwner: UserResponse | null;
  isRoomOwner: boolean;
  selfUserId: number;
  localMuted: boolean;
  localSpeaking: boolean;
  micError: "permission-denied" | "device-error" | null;
  remoteMuted: Map<number, boolean>;
  remoteSpeaking: Map<number, boolean>;
  remoteStreams: Map<number, MediaStream>;
  onToggleMute: () => void;
  onRetryMic: () => void;
  onLeave: () => void;
  onEnd: () => void;
};

export function CallRoomOverlay({
  participants,
  roomOwner,
  isRoomOwner,
  selfUserId,
  localMuted,
  localSpeaking,
  micError,
  remoteMuted,
  remoteSpeaking,
  remoteStreams,
  onToggleMute,
  onRetryMic,
  onLeave,
  onEnd,
}: CallRoomOverlayProps) {
  if (participants.length < 2) {
    return null;
  }

  const remoteAudio = [...remoteStreams.entries()].map(([userId, stream]) => ({ userId, stream }));

  return (
    <div className="w-full border bg-background/95 p-2 shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium">
          {roomOwner ? `${roomOwner.name}'s room` : "Connected room"}
        </p>
        <div className="flex items-center gap-2">
          <IconButton
            size="md"
            variant="outline"
            aria-label={localMuted ? "unmute" : "mute"}
            onClick={onToggleMute}
          >
            <Icon icon={localMuted ? "micOff" : "mic"} className="size-4" />
          </IconButton>
          <Button variant="outline" size="sm" onClick={isRoomOwner ? onEnd : onLeave}>
            {isRoomOwner ? "End" : "Leave"}
          </Button>
        </div>
      </div>

      {micError && (
        <div className="mb-2 flex items-center justify-between gap-2 border bg-muted/40 p-2">
          <p className="truncate text-xs text-muted-foreground">
            {micError === "permission-denied" ? "Mic permission denied" : "Mic unavailable"}
          </p>
          <Button variant="outline" size="sm" onClick={onRetryMic}>
            Retry
          </Button>
        </div>
      )}

      {remoteAudio.map(({ userId, stream }) => (
        <RemoteAudio key={userId} stream={stream} />
      ))}

      <div className="flex flex-wrap gap-2">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={cn(
              "min-w-0 flex-1 basis-28 border bg-muted/40 p-2",
              participant.id === selfUserId
                ? localSpeaking && !localMuted && "border-green-500"
                : (remoteSpeaking.get(participant.id) ?? false) && "border-green-500",
            )}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center">
                <Icon
                  icon={
                    participant.id === selfUserId
                      ? localMuted
                        ? "micOff"
                        : "mic"
                      : (remoteMuted.get(participant.id) ?? false)
                        ? "micOff"
                        : "mic"
                  }
                  className="size-4"
                />
              </span>
              <span className="flex-1" />
            </div>
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
