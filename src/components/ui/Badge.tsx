import type { HTMLAttributes } from "react";

export type BadgeVariant = "neutral" | "success" | "danger" | "warning";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-surface-hover text-muted",
  success: "bg-primary/10 text-primary",
  danger: "bg-danger-surface text-danger",
  warning: "bg-warning-surface text-warning",
};

export default function Badge({
  variant = "neutral",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
