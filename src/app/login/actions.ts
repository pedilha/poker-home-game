"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type MagicLinkState = { error?: string; sent?: boolean };

export async function sendMagicLink(
  _prevState: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.includes("@")) {
    return { error: "Informe um e-mail válido." };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { error: "Não foi possível enviar o link. Tente novamente." };
  }
  return { sent: true };
}
