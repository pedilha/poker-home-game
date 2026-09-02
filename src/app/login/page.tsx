"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMagicLink, type MagicLinkState } from "./actions";
import { Button, Input, GoogleIcon } from "@/components/ui";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<MagicLinkState, FormData>(
    sendMagicLink,
    {},
  );

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Poker Home Game</h1>
          <p className="mt-1 text-sm text-muted">Entre para acessar seus grupos</p>
        </div>

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={signInWithGoogle}
          >
            <GoogleIcon />
            Entrar com Google
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted">
            <div className="h-px flex-1 bg-border" />
            ou
            <div className="h-px flex-1 bg-border" />
          </div>

          {state.sent ? (
            <p className="text-center text-sm text-muted">
              Link enviado! Confira seu e-mail.
            </p>
          ) : (
            <form action={formAction} className="space-y-3">
              <Input
                type="email"
                name="email"
                label="E-mail"
                required
                placeholder="seu@email.com"
              />
              {state.error ? (
                <p className="text-center text-sm text-danger">{state.error}</p>
              ) : null}
              <Button type="submit" fullWidth disabled={pending}>
                <Send className="h-4 w-4" aria-hidden="true" />
                {pending ? "Enviando..." : "Enviar link de acesso"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
