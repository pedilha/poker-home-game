import type { ButtonHTMLAttributes } from "react";
import { buttonVariants, type ButtonSize, type ButtonVariant } from "./button-variants";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export default function Button({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
