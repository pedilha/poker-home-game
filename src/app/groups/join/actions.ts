"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type JoinGroupState = { error?: string; sent?: boolean; groupName?: string };

export async function joinGroup(
  _prevState: JoinGroupState,
  formData: FormData,
): Promise<JoinGroupState> {
  const entryCode = formData.get("entry_code");
  if (typeof entryCode !== "string" || entryCode.trim().length === 0) {
    return { error: "Informe um código de entrada." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: group, error: lookupError } = await supabase
    .rpc("find_group_by_entry_code", { p_entry_code: entryCode.trim().toUpperCase() })
    .returns<{ id: string; name: string }[]>()
    .maybeSingle();

  if (lookupError || !group) {
    return { error: "Código não encontrado." };
  }

  const { error: insertError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "Você já solicitou entrada nesse grupo." };
    }
    return { error: "Não foi possível enviar a solicitação. Tente novamente." };
  }

  return { sent: true, groupName: group.name };
}
