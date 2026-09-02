"use client";

import { useActionState } from "react";
import { declareCashOut, type DeclareState } from "./actions";

export default function DeclareForm({
  groupId,
  matchId,
  participationId,
  playerLabel,
  colors,
}: {
  groupId: string;
  matchId: string;
  participationId: string;
  playerLabel: string;
  colors: { id: string; color_name: string; color_hex: string | null; chipCount: number }[];
}) {
  const [state, formAction, pending] = useActionState<DeclareState, FormData>(
    declareCashOut.bind(null, groupId, matchId, participationId),
    {},
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Declarar fichas
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {playerLabel}
          </p>
        </div>

        <form action={formAction} className="space-y-3">
          {colors.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <span
                className="h-6 w-6 shrink-0 rounded-full border border-zinc-300"
                style={{ backgroundColor: c.color_hex ?? undefined }}
              />
              <span className="w-24 shrink-0 text-sm text-zinc-700 dark:text-zinc-300">
                {c.color_name}
              </span>
              <input
                type="text"
                inputMode="numeric"
                name={`chip_${c.id}`}
                defaultValue={c.chipCount || ""}
                placeholder="0"
                className="h-11 w-full rounded-full border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
          ))}

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
            {pending ? "Salvando..." : "Confirmar declaração"}
          </button>
        </form>
      </div>
    </div>
  );
}
