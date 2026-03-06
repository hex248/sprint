import type { SprintRecord } from "@sprint/shared";
import { useState } from "react";
import SmallSprintDisplay from "@/components/small-sprint-display";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SprintSelect({
  sprints,
  value,
  onChange,
  placeholder = "Select sprint",
}: {
  sprints: SprintRecord[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedSprint = sprints.find((sprint) => sprint.id.toString() === value);
  const openSprints = sprints.filter((sprint) => sprint.open);

  return (
    <Select value={value} onValueChange={onChange} onOpenChange={setIsOpen}>
      <SelectTrigger
        className="group w-auto flex items-center -mt-1"
        variant="unstyled"
        chevronClassName="hidden"
        isOpen={isOpen}
      >
        <SelectValue placeholder={placeholder} className="hover:opacity-85" />
      </SelectTrigger>
      <SelectContent
        side="bottom"
        position="popper"
        className="data-[side=bottom]:translate-y-1 data-[side=bottom]:translate-x-1"
      >
        <SelectItem value="unassigned">
          <SmallSprintDisplay />
        </SelectItem>
        {selectedSprint && !selectedSprint.open && (
          <SelectItem value={selectedSprint.id.toString()} disabled>
            <div className="flex items-center gap-2">
              <SmallSprintDisplay sprint={selectedSprint} />
              <span className="text-[10px] text-muted-foreground uppercase">closed</span>
            </div>
          </SelectItem>
        )}
        {openSprints.map((sprint) => (
          <SelectItem key={sprint.id} value={sprint.id.toString()}>
            <SmallSprintDisplay sprint={sprint} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
