import type { UserResponse } from "@sprint/shared";
import { useState } from "react";
import SmallUserDisplay from "@/components/small-user-display";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function UserSelect({
  users,
  value,
  onChange,
  fallbackUser,
  placeholder = "Select user",
}: {
  users: UserResponse[];
  value: string;
  onChange: (value: string) => void;
  fallbackUser?: UserResponse | null;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const renderSelectedValue = () => {
    if (value === "unassigned") {
      return "Unassigned";
    }

    const user = users.find((u) => u.id.toString() === value);
    const className = "p-0 py-2 text-sm";

    if (user) {
      return <SmallUserDisplay user={user} className={className} />;
    }

    if (fallbackUser) {
      return <SmallUserDisplay user={fallbackUser} className={className} />;
    }

    return null;
  };

  return (
    <Select value={value} onValueChange={onChange} onOpenChange={setIsOpen}>
      <SelectTrigger className="w-fit p-0 px-2 py-2" isOpen={isOpen}>
        <SelectValue placeholder={placeholder}>{renderSelectedValue()}</SelectValue>
      </SelectTrigger>
      <SelectContent
        side="bottom"
        position="popper"
        className="data-[side=bottom]:translate-y-1 data-[side=bottom]:translate-x-1"
      >
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id.toString()}>
            <SmallUserDisplay user={user} className="p-0" />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
