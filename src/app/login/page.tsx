"use client";

import { useActionState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMagicLink, type MagicLinkState } from "./actions";

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
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Poker Home Game
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Entre para acessar seus grupos
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          Entrar com Google
        </button>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          ou
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        {state.sent ? (
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Link enviado! Confira seu e-mail.
          </p>
        ) : (
          <form action={formAction} className="space-y-3">
            <input
              type="email"
              name="email"
              required
              placeholder="seu@email.com"
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
              {pending ? "Enviando..." : "Enviar link de acesso"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
