"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateMatchState = { error?: string };

export async function createMatch(
  groupId: string,
  _prevState: CreateMatchState,
  formData: FormData,
): Promise<CreateMatchState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const participantIds = formData.getAll("participant").filter(
    (v): v is string => typeof v === "string",
  );
  if (participantIds.length === 0) {
    return { error: "Selecione ao menos um participante." };
  }

  const { data: group } = await supabase
    .from("groups")
    .select("default_buyin_value, chip_unit_value")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return { error: "Grupo não encontrado." };

  const { data: colors } = await supabase
    .from("group_chip_colors")
    .select("color_name, color_hex, units, sort_order")
    .eq("group_id", groupId);

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      group_id: groupId,
      leader_id: user.id,
      buyin_value: group.default_buyin_value,
      chip_unit_value: group.chip_unit_value,
    })
    .select("id")
    .single();

  if (matchError || !match) {
    return { error: "Não foi possível criar a partida. Tente novamente." };
  }

  if (colors && colors.length > 0) {
    await supabase.from("match_chip_snapshot").insert(
      colors.map((c) => ({
        match_id: match.id,
        color_name: c.color_name,
        color_hex: c.color_hex,
        units: c.units,
        sort_order: c.sort_order,
      })),
    );
  }

  await supabase.from("participations").insert(
    participantIds.map((userId) => ({
      match_id: match.id,
      user_id: userId,
      status: "playing" as const,
    })),
  );

  redirect(`/groups/${groupId}/matches/${match.id}`);
}
