import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "hover:text-foreground/70 hover:opacity-70",
        destructive: "text-destructive hover:opacity-70",
        yellow: "text-yellow-500 hover:text-yellow-500/70",
        green: "text-green-500 hover:text-green-500/70",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        outline: "border bg-transparent dark:hover:bg-muted/40",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        dummy: "",
      },
      size: {
        default: "w-6 h-6",
        sm: "w-5 h-5",
        md: "w-9 h-9",
        lg: "w-10 h-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function IconButton({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof iconButtonVariants>) {
  return <button type="button" className={cn(iconButtonVariants({ variant, size, className }))} {...props} />;
}

export { IconButton, iconButtonVariants };
