import type { UserRecord } from "@issue/shared";
import { UserRound } from "lucide-react";

export default function Avatar({ user, size }: { user: UserRecord; size?: number }) {
    return (
        <div className={`flex items-center justify-center rounded-full border w-${size || 7} h-${size || 7}`}>
            <UserRound size={size ? size * 2 + 2 : 16} />
        </div>
    );
}
