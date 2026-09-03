"use client";

import { useState, useTransition } from "react";
import { updateTheme } from "./actions";
import { THEMES, type ThemeKey } from "@/lib/themes";

export default function ThemePicker({ currentTheme }: { currentTheme: ThemeKey }) {
  const [selected, setSelected] = useState(currentTheme);
  const [isPending, startTransition] = useTransition();

  function handleSelect(theme: ThemeKey) {
    setSelected(theme);
    document.documentElement.setAttribute("data-theme", theme);
    startTransition(() => {
      updateTheme(theme);
    });
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">Tema</p>
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleSelect(t.key)}
            disabled={isPending}
            className={`flex flex-col items-start gap-1.5 rounded-2xl border p-2.5 text-left text-xs transition-colors disabled:opacity-60 ${
              selected === t.key
                ? "border-primary ring-1 ring-primary"
                : "border-border hover:bg-surface-hover"
            }`}
          >
            <span
              className="h-3 w-full rounded-full"
              style={{ background: t.swatch }}
              aria-hidden="true"
            />
            <span className="text-foreground">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
