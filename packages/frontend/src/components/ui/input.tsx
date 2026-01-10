import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({
    className,
    type,
    showCounter = true,
    ...props
}: React.ComponentProps<"input"> & { showCounter?: boolean }) {
    const maxLength = typeof props.maxLength === "number" ? props.maxLength : undefined;
    const currentLength = typeof props.value === "string" ? props.value.length : undefined;

    return (
        <div
            className={cn(
                "border-input dark:bg-input/30 flex h-9 w-full min-w-0 items-center border bg-transparent",
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
                    "h-full flex-1 min-w-0 bg-transparent px-3 py-1 pr-1 text-base outline-none",
                    "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
                    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                )}
                {...props}
            />
            {showCounter && currentLength !== undefined && maxLength !== undefined && (
                <span
                    className={cn(
                        "border-l px-2 h-full flex w-fit items-center justify-center text-[11px] tabular-nums",
                        currentLength / maxLength >= 1
                            ? "text-destructive"
                            : currentLength / maxLength >= 0.75
                              ? "text-amber-500"
                              : "text-muted-foreground",
                    )}
                >
                    {String(currentLength).padStart(String(maxLength).length, "0")}/{maxLength}
                </span>
            )}
        </div>
    );
}

export { Input };
