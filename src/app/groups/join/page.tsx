"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { joinGroup, type JoinGroupState } from "./actions";
import { Button, Input, LinkButton } from "@/components/ui";

export default function JoinGroupPage() {
  const [state, formAction, pending] = useActionState<JoinGroupState, FormData>(
    joinGroup,
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
        {state.sent ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Solicitação enviada
              </h1>
              <p className="mt-1 text-sm text-muted">
                Pra <strong className="text-foreground">{state.groupName}</strong>.
                Assim que for aprovado, o grupo aparece na sua tela inicial.
              </p>
            </div>
            <LinkButton href="/" fullWidth>
              Voltar para o início
            </LinkButton>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-foreground">
                Entrar com código
              </h1>
              <p className="mt-1 text-sm text-muted">
                Peça o código de entrada para o dono ou admin do grupo
              </p>
            </div>
            <form action={formAction} className="space-y-3">
              <Input
                type="text"
                name="entry_code"
                label="Código de entrada"
                required
                placeholder="Ex: SEXTA01"
              />
              {state.error ? (
                <p className="text-center text-sm text-danger">{state.error}</p>
              ) : null}
              <Button type="submit" fullWidth disabled={pending}>
                {pending ? "Enviando..." : "Solicitar entrada"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
