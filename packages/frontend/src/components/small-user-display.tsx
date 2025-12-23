import type { UserRecord } from "@issue/shared";
import Avatar from "@/components/avatar";

export default function SmallUserDisplay({ user }: { user: UserRecord }) {
    return (
        <div className="flex gap-2 items-center">
            {user.name} <Avatar user={user} />
        </div>
    );
}
