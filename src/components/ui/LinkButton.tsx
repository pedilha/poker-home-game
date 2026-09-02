import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonVariants, type ButtonSize, type ButtonVariant } from "./button-variants";

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export default function LinkButton({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={buttonVariants({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
