import type { ReactNode } from "react";
import { useState } from "react";
import StatusTag from "@/components/status-tag";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function StatusSelect({
  statuses,
  value,
  onChange,
  placeholder = "Select status",
  trigger,
}: {
  statuses: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  trigger?: (args: { isOpen: boolean; value: string }) => ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Select value={value} onValueChange={onChange} onOpenChange={setIsOpen}>
      {trigger ? (
        trigger({ isOpen, value })
      ) : (
        <SelectTrigger
          className="w-fit px-2 text-xs gap-1"
          size="sm"
          chevronClassName={"size-3 -mr-1"}
          isOpen={isOpen}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      )}
      <SelectContent side="bottom" position="popper" align="start">
        {Object.entries(statuses).map(([status, colour]) => (
          <SelectItem key={status} value={status} textClassName="text-xs">
            <StatusTag status={status} colour={colour} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
