"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createGroup, type CreateGroupState } from "./actions";
import { Button, Input } from "@/components/ui";

export default function NewGroupPage() {
  const [state, formAction, pending] = useActionState<CreateGroupState, FormData>(
    createGroup,
    {},
  );

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4">
      <Link
        href="/groups/add"
        aria-label="Voltar"
        className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </Link>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Criar grupo</h1>
          <p className="mt-1 text-sm text-muted">
            Você vira o dono e pode convidar seu grupo pelo código de entrada
          </p>
        </div>

        <form action={formAction} className="space-y-3">
          <Input
            type="text"
            name="name"
            label="Nome do grupo"
            required
            placeholder="Ex: Sexta do Pedro"
          />
          <Input
            type="text"
            name="entry_code"
            label="Código de entrada"
            required
            placeholder="Ex: SEXTA01"
          />
          <Input
            type="text"
            inputMode="decimal"
            name="default_buyin_value"
            label="Valor do buy-in (R$)"
            required
            placeholder="Ex: 50"
          />

          {state.error ? (
            <p className="text-center text-sm text-danger">{state.error}</p>
          ) : null}

          <Button type="submit" fullWidth disabled={pending}>
            {pending ? "Criando..." : "Criar grupo"}
          </Button>
        </form>
      </div>
    </div>
  );
}
