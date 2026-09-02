"use client";

import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  closeMatch,
  closeWithProportionalCorrection,
  type CloseMatchResult,
} from "./actions";
import { Button, Card } from "@/components/ui";

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
      <Card className="space-y-3 border-warning/30 bg-warning-surface p-4 text-sm">
        <p className="flex items-start gap-2 text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Total investido: R$ {state.totalInvested.toFixed(2)} — Total
            declarado: R$ {state.totalDeclared.toFixed(2)}. Diferença de R${" "}
            {Math.abs(state.divergenceAmount).toFixed(2)}.
          </span>
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <form
            action={closeWithProportionalCorrection.bind(null, groupId, matchId)}
            className="flex-1"
          >
            <Button size="sm" fullWidth>
              Fechar com correção proporcional
            </Button>
          </form>
          <Button
            type="button"
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => window.location.reload()}
          >
            Corrigir declarações
          </Button>
        </div>
      </Card>
    );
  }

  if (state && !state.closed && "pendingDeclarations" in state) {
    return (
      <p className="text-center text-sm text-muted">
        Faltam {state.pendingDeclarations} jogador(es) declarar antes de
        fechar.
      </p>
    );
  }

  return (
    <form action={formAction}>
      <Button type="submit" variant="outline" fullWidth disabled={pending}>
        {pending ? "Verificando..." : "Fechar partida"}
      </Button>
    </form>
  );
}
