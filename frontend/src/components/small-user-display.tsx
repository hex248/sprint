import type { UserResponse } from "@sprint/shared";
import Avatar from "@/components/avatar";
import { cn } from "@/lib/utils";

export default function SmallUserDisplay({ user, className }: { user: UserResponse; className?: string }) {
  return (
    <div className={cn("flex gap-2 items-center", className)}>
      <Avatar
        name={user.name}
        username={user.username}
        avatarURL={user.avatarURL}
        size={6}
        textClass="text-xs"
      />
      {user.name}
    </div>
  );
}
