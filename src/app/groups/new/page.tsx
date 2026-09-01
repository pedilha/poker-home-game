"use client";

import { useActionState } from "react";
import { createGroup, type CreateGroupState } from "./actions";

export default function NewGroupPage() {
  const [state, formAction, pending] = useActionState<CreateGroupState, FormData>(
    createGroup,
    {},
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Criar grupo
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Você vira o dono e pode convidar seu grupo pelo código de entrada
          </p>
        </div>

        <form action={formAction} className="space-y-3">
          <input
            type="text"
            name="name"
            required
            placeholder="Nome do grupo (ex: Sexta do Pedro)"
            className="h-11 w-full rounded-full border border-zinc-300 bg-white px-5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <input
            type="text"
            name="entry_code"
            required
            placeholder="Código de entrada (ex: SEXTA01)"
            className="h-11 w-full rounded-full border border-zinc-300 bg-white px-5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <input
            type="text"
            inputMode="decimal"
            name="default_buyin_value"
            required
            placeholder="Valor do buy-in (R$)"
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
            {pending ? "Criando..." : "Criar grupo"}
          </button>
        </form>
      </div>
    </div>
  );
}
