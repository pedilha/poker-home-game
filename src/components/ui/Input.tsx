import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export default function Input({ label, hint, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={inputId}
        className={`h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary ${className}`}
        {...props}
      />
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
