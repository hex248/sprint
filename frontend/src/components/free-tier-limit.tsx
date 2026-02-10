import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function FreeTierLimit({
  current,
  limit,
  itemName,
  isPro,
  className,
  showUpgrade = true,
}: {
  current: number;
  limit: number;
  itemName: string;
  isPro: boolean;
  className?: string;
  showUpgrade?: boolean;
}) {
  if (isPro) return null;

  const percentage = Math.min((current / limit) * 100, 100);
  const isAtLimit = current >= limit;
  const isNearLimit = percentage >= 80 && !isAtLimit;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {current} / {limit} {itemName}
          {current !== 1 ? "s" : ""}
        </span>
        {isAtLimit && <span className="text-destructive font-medium">Limit reached</span>}
        {isNearLimit && <span className="text-yellow-600 font-medium">Almost at limit</span>}
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            isAtLimit ? "bg-destructive" : isNearLimit ? "bg-yellow-500" : "bg-personality",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isAtLimit && showUpgrade && (
        <div className="flex items-center gap-2 mt-1">
          <Icon icon="info" className="size-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Upgrade to Pro for unlimited {itemName}s</span>
          <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-personality">
            <Link to="/plans">Upgrade</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

interface FreeTierLimitBadgeProps {
  current: number;
  limit: number;
  itemName: string;
  isPro: boolean;
  className?: string;
}

export function FreeTierLimitBadge({ current, limit, itemName, isPro, className }: FreeTierLimitBadgeProps) {
  if (isPro) return null;

  const isAtLimit = current >= limit;
  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80 && !isAtLimit;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border",
        isAtLimit
          ? "bg-destructive/10 border-destructive/30 text-destructive"
          : isNearLimit
            ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-700"
            : "bg-muted border-border text-muted-foreground",
        className,
      )}
    >
      <Icon icon={isAtLimit ? "alertTriangle" : isNearLimit ? "info" : "check"} className="size-3.5" />
      <span>
        {current}/{limit} {itemName}
        {current !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
