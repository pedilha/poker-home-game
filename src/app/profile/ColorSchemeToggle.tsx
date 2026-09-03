"use client";

import { useState, useTransition } from "react";
import { Moon, Sun } from "lucide-react";
import { updateColorScheme } from "./actions";
import type { ColorScheme } from "@/lib/themes";

const OPTIONS: { key: ColorScheme; label: string; icon: typeof Sun }[] = [
  { key: "light", label: "Claro", icon: Sun },
  { key: "dark", label: "Escuro", icon: Moon },
];

export default function ColorSchemeToggle({
  currentScheme,
}: {
  currentScheme: ColorScheme;
}) {
  const [selected, setSelected] = useState(currentScheme);
  const [isPending, startTransition] = useTransition();

  function handleSelect(scheme: ColorScheme) {
    setSelected(scheme);
    document.documentElement.setAttribute("data-mode", scheme);
    startTransition(() => {
      updateColorScheme(scheme);
    });
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">Aparência</p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => handleSelect(o.key)}
            disabled={isPending}
            className={`flex items-center justify-center gap-2 rounded-2xl border p-2.5 text-sm transition-colors disabled:opacity-60 ${
              selected === o.key
                ? "border-primary text-foreground ring-1 ring-primary"
                : "border-border text-muted hover:bg-surface-hover"
            }`}
          >
            <o.icon className="h-4 w-4" aria-hidden="true" />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
