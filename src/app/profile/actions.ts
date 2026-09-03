"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string; saved?: boolean };

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = formData.get("display_name");
  const nickname = formData.get("nickname");
  const avatarFile = formData.get("avatar");

  if (typeof displayName !== "string" || displayName.trim().length === 0) {
    return { error: "Informe seu nome." };
  }

  let avatarUrl: string | undefined;

  if (avatarFile instanceof File && avatarFile.size > 0) {
    const path = `avatars/${user.id}/avatar`;
    try {
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

      if (uploadError) {
        return { error: `Não foi possível enviar a foto: ${uploadError.message}` };
      }

      const { data: publicUrl } = supabase.storage.from("images").getPublicUrl(path);
      avatarUrl = `${publicUrl.publicUrl}?t=${Date.now()}`;
    } catch {
      return {
        error:
          "Não foi possível enviar a foto (falha de rede). O bucket de imagens existe no Supabase?",
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName.trim(),
      nickname: typeof nickname === "string" && nickname.trim() ? nickname.trim() : null,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/profile");
  return { saved: true };
}

export async function updateTheme(theme: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ theme }).eq("id", user.id);
  revalidatePath("/", "layout");
}

export async function updateColorScheme(colorScheme: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ color_scheme: colorScheme }).eq("id", user.id);
  revalidatePath("/", "layout");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
