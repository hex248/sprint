import type { ReactNode } from "react";
import { useState } from "react";
import Icon, { type IconName } from "@/components/ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type IssueTypeConfig = {
  icon: string;
  color: string;
};

export function TypeSelect({
  issueTypes,
  value,
  onChange,
  placeholder = "Select type",
  trigger,
}: {
  issueTypes: Record<string, IssueTypeConfig>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  trigger?: (args: { isOpen: boolean; value: string }) => ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedType = issueTypes[value];

  return (
    <Select value={value} onValueChange={onChange} onOpenChange={setIsOpen}>
      {trigger ? (
        trigger({ isOpen, value })
      ) : (
        <SelectTrigger
          className="w-fit px-2 text-sm gap-1"
          size="sm"
          chevronClassName="size-3 -mr-1"
          isOpen={isOpen}
        >
          {selectedType ? (
            <span className="flex items-center gap-1.5">
              <Icon icon={selectedType.icon as IconName} size={20} color={selectedType.color} />
            </span>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
      )}
      <SelectContent side="bottom" position="popper" align="start">
        {Object.entries(issueTypes).map(([typeName, typeConfig]) => (
          <SelectItem key={typeName} value={typeName} textClassName="text-sm">
            <span className="flex items-center gap-2">
              <Icon icon={typeConfig.icon as IconName} size={20} color={typeConfig.color} />
              <span>{typeName}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
