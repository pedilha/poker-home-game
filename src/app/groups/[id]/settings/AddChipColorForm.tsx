"use client";

import { useActionState } from "react";
import { addChipColor, type ChipColorState } from "./actions";

export default function AddChipColorForm({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState<ChipColorState, FormData>(
    addChipColor.bind(null, groupId),
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-3">
        <input
          type="color"
          name="color_hex"
          defaultValue="#e5e5e5"
          className="h-11 w-14 rounded-full border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          type="text"
          name="color_name"
          required
          placeholder="Nome da cor (ex: Branca)"
          className="h-11 w-full rounded-full border border-zinc-300 bg-white px-5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <input
        type="text"
        inputMode="numeric"
        name="units"
        required
        placeholder="Quantas unidades essa cor vale (ex: 1, 5, 25...)"
        className="h-11 w-full rounded-full border border-zinc-300 bg-white px-5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />

      {state.error ? (
        <p className="text-center text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {pending ? "Adicionando..." : "Adicionar cor"}
      </button>
    </form>
  );
}
