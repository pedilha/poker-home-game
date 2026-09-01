"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ChipColorState = { error?: string };

async function requireOwner(supabase: Awaited<ReturnType<typeof createClient>>, groupId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: group } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .maybeSingle();
  return group?.owner_id === user.id;
}

export async function addChipColor(
  groupId: string,
  _prevState: ChipColorState,
  formData: FormData,
): Promise<ChipColorState> {
  const supabase = await createClient();
  if (!(await requireOwner(supabase, groupId))) {
    return { error: "Só o dono do grupo pode editar a configuração de fichas." };
  }

  const colorName = formData.get("color_name");
  const colorHex = formData.get("color_hex");
  const units = Number(formData.get("units"));

  if (typeof colorName !== "string" || colorName.trim().length === 0) {
    return { error: "Informe o nome da cor." };
  }
  if (!Number.isFinite(units) || units <= 0) {
    return { error: "Informe quantas unidades essa cor vale." };
  }

  const { error } = await supabase.from("group_chip_colors").insert({
    group_id: groupId,
    color_name: colorName.trim(),
    color_hex: typeof colorHex === "string" ? colorHex : null,
    units,
  });

  if (error) {
    return { error: "Não foi possível adicionar a cor. Tente novamente." };
  }

  revalidatePath(`/groups/${groupId}/settings`);
  return {};
}

export async function updateChipColor(
  groupId: string,
  colorId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  if (!(await requireOwner(supabase, groupId))) return;

  const colorName = formData.get("color_name");
  const colorHex = formData.get("color_hex");
  const units = Number(formData.get("units"));

  if (typeof colorName !== "string" || colorName.trim().length === 0) return;
  if (!Number.isFinite(units) || units <= 0) return;

  await supabase
    .from("group_chip_colors")
    .update({
      color_name: colorName.trim(),
      color_hex: typeof colorHex === "string" ? colorHex : null,
      units,
    })
    .eq("id", colorId);

  revalidatePath(`/groups/${groupId}/settings`);
}

export async function deleteChipColor(groupId: string, colorId: string) {
  const supabase = await createClient();
  if (!(await requireOwner(supabase, groupId))) return;

  await supabase.from("group_chip_colors").delete().eq("id", colorId);
  revalidatePath(`/groups/${groupId}/settings`);
}

export async function updateBuyinValue(groupId: string, formData: FormData) {
  const supabase = await createClient();
  if (!(await requireOwner(supabase, groupId))) return;

  const raw = formData.get("default_buyin_value");
  const value = typeof raw === "string" ? Number(raw.replace(",", ".")) : NaN;
  if (!Number.isFinite(value) || value <= 0) return;

  await supabase.from("groups").update({ default_buyin_value: value }).eq("id", groupId);
  revalidatePath(`/groups/${groupId}/settings`);
  revalidatePath(`/groups/${groupId}`);
}

export async function updateChipUnitValue(groupId: string, formData: FormData) {
  const supabase = await createClient();
  if (!(await requireOwner(supabase, groupId))) return;

  const raw = formData.get("chip_unit_value");
  const value = typeof raw === "string" ? Number(raw.replace(",", ".")) : NaN;
  if (!Number.isFinite(value) || value <= 0) return;

  await supabase.from("groups").update({ chip_unit_value: value }).eq("id", groupId);
  revalidatePath(`/groups/${groupId}/settings`);
}
