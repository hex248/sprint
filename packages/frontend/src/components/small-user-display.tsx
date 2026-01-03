import type { UserRecord } from "@issue/shared";
import Avatar from "@/components/avatar";

export default function SmallUserDisplay({ user }: { user: UserRecord }) {
    return (
        <div className="flex gap-2 items-center">
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
