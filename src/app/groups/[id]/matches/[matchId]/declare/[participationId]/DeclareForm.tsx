"use client";

import { useActionState } from "react";
import { declareCashOut, type DeclareState } from "./actions";
import { Button, PageContainer, PageHeader } from "@/components/ui";

export default function DeclareForm({
  groupId,
  matchId,
  participationId,
  playerLabel,
  colors,
  rebuysCount,
}: {
  groupId: string;
  matchId: string;
  participationId: string;
  playerLabel: string;
  colors: { id: string; color_name: string; color_hex: string | null; chipCount: number }[];
  rebuysCount: number;
}) {
  const [state, formAction, pending] = useActionState<DeclareState, FormData>(
    declareCashOut.bind(null, groupId, matchId, participationId),
    {},
  );

  return (
    <PageContainer>
      <PageHeader
        title="Declarar fichas"
        subtitle={playerLabel}
        backHref={`/groups/${groupId}/matches/${matchId}`}
      />

      <form action={formAction} className="space-y-3">
        {colors.map((c) => {
          const inputId = `chip_${c.id}`;
          return (
            <div key={c.id} className="flex items-center gap-3">
              <span
                className="h-6 w-6 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: c.color_hex ?? undefined }}
                aria-hidden="true"
              />
              <label htmlFor={inputId} className="w-24 shrink-0 text-sm text-foreground">
                {c.color_name}
              </label>
              <input
                id={inputId}
                type="text"
                inputMode="numeric"
                name={inputId}
                defaultValue={c.chipCount || ""}
                placeholder="0"
                className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          );
        })}

        <div className="flex items-center gap-3">
          <label htmlFor="rebuys" className="w-24 shrink-0 text-sm text-foreground">
            Rebuys
          </label>
          <input
            id="rebuys"
            type="text"
            inputMode="numeric"
            name="rebuys"
            defaultValue={rebuysCount || ""}
            placeholder="0"
            className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        {state.error ? <p className="text-center text-sm text-danger">{state.error}</p> : null}

        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "Salvando..." : "Confirmar declaração"}
        </Button>
      </form>
    </PageContainer>
  );
}
