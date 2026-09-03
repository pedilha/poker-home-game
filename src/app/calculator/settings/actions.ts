"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ChipColorState = { error?: string };

export async function addChipColor(
  _prevState: ChipColorState,
  formData: FormData,
): Promise<ChipColorState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada, faça login de novo." };

  const colorName = formData.get("color_name");
  const colorHex = formData.get("color_hex");
  const units = Number(formData.get("units"));

  if (typeof colorName !== "string" || colorName.trim().length === 0) {
    return { error: "Informe o nome da cor." };
  }
  if (!Number.isFinite(units) || units <= 0) {
    return { error: "Informe quantas unidades essa cor vale." };
  }

  const { error } = await supabase.from("calculator_chip_colors").insert({
    user_id: user.id,
    color_name: colorName.trim(),
    color_hex: typeof colorHex === "string" ? colorHex : null,
    units,
  });

  if (error) {
    return { error: "Não foi possível adicionar a cor. Tente novamente." };
  }

  revalidatePath("/calculator/settings");
  return {};
}

export async function updateChipColor(colorId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const colorName = formData.get("color_name");
  const colorHex = formData.get("color_hex");
  const units = Number(formData.get("units"));

  if (typeof colorName !== "string" || colorName.trim().length === 0) return;
  if (!Number.isFinite(units) || units <= 0) return;

  await supabase
    .from("calculator_chip_colors")
    .update({
      color_name: colorName.trim(),
      color_hex: typeof colorHex === "string" ? colorHex : null,
      units,
    })
    .eq("id", colorId)
    .eq("user_id", user.id);

  revalidatePath("/calculator/settings");
}

export async function deleteChipColor(colorId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("calculator_chip_colors").delete().eq("id", colorId).eq("user_id", user.id);
  revalidatePath("/calculator/settings");
}

export async function updateCalculatorUnitValue(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const raw = formData.get("calculator_unit_value");
  const value = typeof raw === "string" ? Number(raw.replace(",", ".")) : NaN;
  if (!Number.isFinite(value) || value <= 0) return;

  await supabase
    .from("profiles")
    .update({ calculator_unit_value: value })
    .eq("id", user.id);

  revalidatePath("/calculator/settings");
  revalidatePath("/calculator");
}
