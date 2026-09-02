import type { ElementType, HTMLAttributes } from "react";

type CardProps<T extends ElementType> = HTMLAttributes<HTMLElement> & {
  as?: T;
};

export default function Card<T extends ElementType = "div">({
  as,
  className = "",
  ...props
}: CardProps<T>) {
  const Component = as ?? "div";
  return (
    <Component
      className={`rounded-2xl border border-border bg-surface ${className}`}
      {...props}
    />
  );
}
