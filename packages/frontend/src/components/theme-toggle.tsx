import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();
    const resolvedTheme =
        theme === "system"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
            : theme;
    const isDark = resolvedTheme === "dark";

    return (
        <IconButton
            size="md"
            className={cn("hover:text-muted-foreground", className)}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </IconButton>
    );
}

export default ThemeToggle;
