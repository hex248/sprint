import { DEFAULT_STATUS_COLOUR } from "@sprint/shared";
import { cn, DARK_TEXT_COLOUR, isLight } from "@/lib/utils";

export default function StatusTag({
  status,
  colour = DEFAULT_STATUS_COLOUR,
  className,
}: {
  status: string;
  colour: string;
  className?: string;
}) {
  const textColour = isLight(colour) ? DARK_TEXT_COLOUR : "var(--foreground)";

  return (
    <div
      className={cn(
        "text-xs px-1 rounded inline-flex whitespace-nowrap border border-foreground/10",
        className,
      )}
      style={{ backgroundColor: colour, color: textColour }}
    >
      {status}
    </div>
  );
}
