"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateGroupState = { error?: string };

export async function createGroup(
  _prevState: CreateGroupState,
  formData: FormData,
): Promise<CreateGroupState> {
  const name = formData.get("name");
  const entryCode = formData.get("entry_code");
  const buyinValueRaw = formData.get("default_buyin_value");
  const buyinValue =
    typeof buyinValueRaw === "string"
      ? Number(buyinValueRaw.replace(",", "."))
      : NaN;

  if (typeof name !== "string" || name.trim().length === 0) {
    return { error: "Informe o nome do grupo." };
  }
  if (typeof entryCode !== "string" || entryCode.trim().length === 0) {
    return { error: "Informe um código de entrada." };
  }
  if (!Number.isFinite(buyinValue) || buyinValue <= 0) {
    return { error: "Informe um valor de buy-in válido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("groups")
    .insert({
      name: name.trim(),
      entry_code: entryCode.trim().toUpperCase(),
      owner_id: user.id,
      default_buyin_value: buyinValue,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Esse código de entrada já está em uso. Escolha outro." };
    }
    return { error: "Não foi possível criar o grupo. Tente novamente." };
  }

  redirect(`/groups/${data.id}`);
}
