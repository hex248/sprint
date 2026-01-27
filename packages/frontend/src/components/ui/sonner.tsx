import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import Icon from "@/components/ui/icon";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <Icon icon="circleCheck" className="size-4" />,
        info: <Icon icon="info" className="size-4" />,
        warning: <Icon icon="triangleAlert" className="size-4" />,
        error: <Icon icon="octagonX" className="size-4" />,
        loading: <Icon icon="loader2" className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "0",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
