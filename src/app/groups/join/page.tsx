"use client";

import { useActionState } from "react";
import Link from "next/link";
import { joinGroup, type JoinGroupState } from "./actions";

export default function JoinGroupPage() {
  const [state, formAction, pending] = useActionState<JoinGroupState, FormData>(
    joinGroup,
    {},
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Entrar com código
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Peça o código de entrada para o dono ou admin do grupo
          </p>
        </div>

        {state.sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Solicitação enviada para <strong>{state.groupName}</strong>. Assim
              que for aprovado, o grupo aparece na sua tela inicial.
            </p>
            <Link
              href="/"
              className="flex h-11 w-full items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Voltar para o início
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-3">
            <input
              type="text"
              name="entry_code"
              required
              placeholder="Código de entrada"
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
              {pending ? "Enviando..." : "Solicitar entrada"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
