"use client";

import { useActionState } from "react";
import {
  closeMatch,
  closeWithProportionalCorrection,
  type CloseMatchResult,
} from "./actions";

export default function CloseMatchPanel({
  groupId,
  matchId,
}: {
  groupId: string;
  matchId: string;
}) {
  const [state, formAction, pending] = useActionState<
    CloseMatchResult | null,
    FormData
  >(closeMatch.bind(null, groupId, matchId), null);

  if (state && !state.closed && "isDivergent" in state) {
    return (
      <div className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950">
        <p className="text-amber-900 dark:text-amber-100">
          Total investido: R$ {state.totalInvested.toFixed(2)} — Total
          declarado: R$ {state.totalDeclared.toFixed(2)}. Diferença de R${" "}
          {Math.abs(state.divergenceAmount).toFixed(2)}.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <form
            action={closeWithProportionalCorrection.bind(null, groupId, matchId)}
            className="flex-1"
          >
            <button className="flex h-10 w-full items-center justify-center rounded-full bg-foreground px-4 text-xs font-medium text-background">
              Fechar com correção proporcional
            </button>
          </form>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex h-10 w-full items-center justify-center rounded-full border border-zinc-300 px-4 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
          >
            Corrigir declarações
          </button>
        </div>
      </div>
    );
  }

  if (state && !state.closed && "pendingDeclarations" in state) {
    return (
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Faltam {state.pendingDeclarations} jogador(es) declarar antes de
        fechar.
      </p>
    );
  }

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-50"
      >
        {pending ? "Verificando..." : "Fechar partida"}
      </button>
    </form>
  );
}
