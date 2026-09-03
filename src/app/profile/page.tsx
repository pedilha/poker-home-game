import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import ProfileForm from "./ProfileForm";
import ThemePicker from "./ThemePicker";
import ColorSchemeToggle from "./ColorSchemeToggle";
import { Button, PageContainer, PageHeader } from "@/components/ui";
import {
  DEFAULT_COLOR_SCHEME,
  DEFAULT_THEME,
  isColorScheme,
  isThemeKey,
} from "@/lib/themes";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, nickname, avatar_url, theme, color_scheme")
    .eq("id", user.id)
    .maybeSingle();

  const currentTheme =
    profile?.theme && isThemeKey(profile.theme) ? profile.theme : DEFAULT_THEME;
  const currentScheme =
    profile?.color_scheme && isColorScheme(profile.color_scheme)
      ? profile.color_scheme
      : DEFAULT_COLOR_SCHEME;

  return (
    <PageContainer bottomNav>
      <PageHeader title="Perfil" />

      <ProfileForm
        displayName={profile?.display_name ?? ""}
        nickname={profile?.nickname ?? null}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <ColorSchemeToggle currentScheme={currentScheme} />
      <ThemePicker currentTheme={currentTheme} />

      <form action={signOut}>
        <Button type="submit" variant="ghost" fullWidth>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sair
        </Button>
      </form>
    </PageContainer>
  );
}
