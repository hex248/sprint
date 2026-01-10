import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    const maxLength = typeof props.maxLength === "number" ? props.maxLength : undefined;
    const currentLength = typeof props.value === "string" ? props.value.length : undefined;

    const showCounter = typeof maxLength === "number" && maxLength > 0 && typeof currentLength === "number";

    if (!showCounter) {
        return (
            <input
                type={type}
                data-slot="input"
                className={cn(
                    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    "focus-visible:border-ring",
                    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                    className,
                )}
                {...props}
            />
        );
    }

    const counterPercent = currentLength / maxLength;

    return (
        <div
            className={cn(
                "border-input dark:bg-input/30 flex h-9 w-full min-w-0 items-center border bg-transparent shadow-xs",
                "transition-[color,box-shadow]",
                "has-[:focus-visible]:border-ring",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                "aria-invalid:border-destructive",
                className,
            )}
        >
            <input
                type={type}
                data-slot="input"
                className={cn(
                    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
                    "h-full w-full min-w-0 bg-transparent px-3 py-1 pr-1 text-base outline-none",
                    "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
                    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                )}
                {...props}
            />
            <span
                className={cn(
                    "px-2 text-[11px] tabular-nums",
                    counterPercent >= 1
                        ? "text-destructive"
                        : counterPercent >= 0.8
                          ? "text-amber-500"
                          : "text-muted-foreground",
                )}
            >
                {currentLength}/{maxLength}
            </span>
        </div>
    );
}

export { Input };
