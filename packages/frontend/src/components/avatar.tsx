import type { UserRecord } from "@issue/shared";
import { UserRound } from "lucide-react";

export default function Avatar({ user, size }: { user?: UserRecord; size?: number }) {
    if (user?.avatarURL) {
        return (
            <img
                src={user.avatarURL}
                alt="Avatar"
                className={`rounded-full object-cover w-${size || 6} h-${size || 6}`}
            />
        );
    }

    return (
        <div
            className={`flex items-center justify-center rounded-full ${user && "border"} w-${size || 6} h-${size || 6}`}
        >
            {user && <UserRound size={size ? size * 2 + 2 : 14} />}
        </div>
    );
}
