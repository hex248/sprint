import type * as React from "react";
import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";

function Input({
  className,
  type,
  showCounter = true,
  showHashPrefix = false,
  inputClassName,
  ...props
}: React.ComponentProps<"input"> & {
  showCounter?: boolean;
  showHashPrefix?: boolean;
  inputClassName?: string;
}) {
  const maxLength = typeof props.maxLength === "number" ? props.maxLength : undefined;
  const currentLength = typeof props.value === "string" ? props.value.length : undefined;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isSearch = type === "search";
  const canClear = isSearch && typeof props.value === "string" && props.value.length > 0;

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
      {showHashPrefix && (
        <span className="border-r px-1 py-1 text-muted-foreground">
          <Icon icon="hash" className="size-3.5" />
        </span>
      )}
      <input
        ref={inputRef}
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
          "h-full flex-1 min-w-0 bg-transparent px-3 py-1 pr-1 text-base outline-none",
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "appearance-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          showHashPrefix ? "pl-2 py-0" : "pl-3",
          inputClassName,
        )}
        {...props}
      />
      {canClear && (
        <button
          type="button"
          className="cursor-pointer px-2 h-full flex w-fit items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
          onClick={() => {
            if (inputRef.current) {
              const nativeInputValue = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value",
              );
              nativeInputValue?.set?.call(inputRef.current, "");
              inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
              inputRef.current.focus();
            }
          }}
        >
          <Icon icon="x" className="size-4" />
        </button>
      )}
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
