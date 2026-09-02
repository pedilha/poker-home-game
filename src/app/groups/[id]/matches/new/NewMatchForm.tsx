"use client";

import { useActionState } from "react";
import { createMatch, type CreateMatchState } from "./actions";
import { Button, PageContainer, PageHeader } from "@/components/ui";

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
    <PageContainer>
      <PageHeader
        title="Iniciar partida"
        subtitle="Selecione quem vai jogar. Você vira o líder desta partida."
        backHref={`/groups/${groupId}`}
      />

      <form action={formAction} className="space-y-4">
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.user_id}>
              <label className="flex h-11 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-4 text-sm text-foreground transition-colors hover:bg-surface-hover">
                <input
                  type="checkbox"
                  name="participant"
                  value={m.user_id}
                  defaultChecked
                  className="h-4 w-4 accent-primary"
                />
                {m.label}
              </label>
            </li>
          ))}
        </ul>

        {state.error ? <p className="text-center text-sm text-danger">{state.error}</p> : null}

        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "Criando..." : "Iniciar partida"}
        </Button>
      </form>
    </PageContainer>
  );
}
