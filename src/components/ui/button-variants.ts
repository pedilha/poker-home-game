export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
export type ButtonSize = "md" | "sm";

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const sizes: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-sm",
  sm: "h-9 px-4 text-xs",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:brightness-110",
  secondary: "bg-surface-hover text-foreground hover:bg-border",
  outline: "border border-border text-foreground hover:bg-surface-hover",
  danger: "border border-border text-danger hover:bg-danger-surface",
  ghost: "text-muted hover:text-foreground",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className = "",
  fullWidth = false,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  fullWidth?: boolean;
} = {}) {
  return [base, sizes[size], variants[variant], fullWidth ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}
