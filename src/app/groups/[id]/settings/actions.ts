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

export async function updateGroupName(groupId: string, formData: FormData) {
  const supabase = await createClient();
  if (!(await requireOwner(supabase, groupId))) return;

  const raw = formData.get("name");
  if (typeof raw !== "string" || raw.trim().length === 0) return;

  await supabase.from("groups").update({ name: raw.trim() }).eq("id", groupId);
  revalidatePath(`/groups/${groupId}/settings`);
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/");
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

export type CoverImageState = { error?: string };

export async function updateCoverImage(
  groupId: string,
  _prevState: CoverImageState,
  formData: FormData,
): Promise<CoverImageState> {
  const supabase = await createClient();
  if (!(await requireOwner(supabase, groupId))) {
    return { error: "Só o dono do grupo pode editar a capa." };
  }

  const file = formData.get("cover");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Escolha uma imagem." };
  }

  const path = `groups/${groupId}/cover`;
  let publicUrl: { publicUrl: string };
  try {
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      return { error: `Não foi possível enviar a imagem: ${uploadError.message}` };
    }

    ({ data: publicUrl } = supabase.storage.from("images").getPublicUrl(path));
  } catch {
    return {
      error:
        "Não foi possível enviar a imagem (falha de rede). O bucket de imagens existe no Supabase?",
    };
  }

  await supabase
    .from("groups")
    .update({ cover_image_url: `${publicUrl.publicUrl}?t=${Date.now()}` })
    .eq("id", groupId);

  revalidatePath(`/groups/${groupId}/settings`);
  revalidatePath("/");
  return {};
}
