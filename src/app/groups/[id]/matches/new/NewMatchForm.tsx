"use client";

import { useActionState } from "react";
import { createMatch, type CreateMatchState } from "./actions";

export default function NewMatchForm({
  groupId,
  members,
}: {
  groupId: string;
  members: { user_id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState<CreateMatchState, FormData>(
    createMatch.bind(null, groupId),
    {},
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Iniciar partida
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Selecione quem vai jogar. Você vira o líder desta partida.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.user_id}>
                <label className="flex h-11 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
                  <input
                    type="checkbox"
                    name="participant"
                    value={m.user_id}
                    defaultChecked
                    className="h-4 w-4"
                  />
                  {m.label}
                </label>
              </li>
            ))}
          </ul>

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
            {pending ? "Criando..." : "Iniciar partida"}
          </button>
        </form>
      </div>
    </div>
  );
}
