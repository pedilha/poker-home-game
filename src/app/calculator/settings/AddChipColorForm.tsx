"use client";

import { useActionState } from "react";
import { addChipColor, type ChipColorState } from "./actions";
import { Button, Input } from "@/components/ui";

export default function AddChipColorForm() {
  const [state, formAction, pending] = useActionState<ChipColorState, FormData>(
    addChipColor,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5">
          <label htmlFor="color_hex" className="block text-sm font-medium text-foreground">
            Cor
          </label>
          <input
            id="color_hex"
            type="color"
            name="color_hex"
            defaultValue="#e5e5e5"
            className="h-11 w-14 rounded-2xl border border-border bg-surface"
          />
        </div>
        <div className="flex-1">
          <Input type="text" name="color_name" label="Nome da cor" required placeholder="Ex: Roxa" />
        </div>
      </div>
      <Input
        type="text"
        inputMode="numeric"
        name="units"
        label="Quantas unidades essa cor vale"
        required
        placeholder="Ex: 1, 5, 25..."
      />

      {state.error ? <p className="text-center text-sm text-danger">{state.error}</p> : null}

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Adicionando..." : "Adicionar cor"}
      </Button>
    </form>
  );
}
