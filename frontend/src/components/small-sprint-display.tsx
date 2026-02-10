import { DEFAULT_SPRINT_COLOUR, type SprintRecord } from "@sprint/shared";
import { cn, DARK_TEXT_COLOUR, isLight } from "@/lib/utils";

export default function SmallSprintDisplay({
  sprint,
  className,
}: {
  sprint?: SprintRecord;
  className?: string;
}) {
  const colour = sprint?.color || DEFAULT_SPRINT_COLOUR;
  const textColour = isLight(colour) ? DARK_TEXT_COLOUR : "var(--foreground)";

  return (
    <div
      className={cn(
        "text-xs px-1.5 rounded-full inline-flex whitespace-nowrap border border-foreground/10",
        className,
      )}
      style={{ backgroundColor: colour, color: textColour }}
    >
      {sprint?.name || "None"}
    </div>
  );
}
