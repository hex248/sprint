import { useTheme } from "@/components/theme-provider";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

function ThemeToggle({ withText, className }: { withText?: boolean; className?: string }) {
  const { theme, setTheme } = useTheme();
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  const isDark = resolvedTheme === "dark";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <IconButton
        size="md"
        className={cn("hover:text-muted-foreground", className)}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Icon icon="sun" className="size-5" /> : <Icon icon="moon" className="size-5" />}
      </IconButton>
      {withText && (isDark ? "Dark Mode" : "Light Mode")}
    </div>
  );
}

export default ThemeToggle;
