import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_COLOR_SCHEME,
  DEFAULT_THEME,
  isColorScheme,
  isThemeKey,
} from "@/lib/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Poker Home Game",
  description:
    "Conciliação de dinheiro para home games de poker — conversão de fichas, buy-ins e ranking do grupo.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let theme: string = DEFAULT_THEME;
  let colorScheme: string = DEFAULT_COLOR_SCHEME;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("theme, color_scheme")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.theme && isThemeKey(profile.theme)) {
      theme = profile.theme;
    }
    if (profile?.color_scheme && isColorScheme(profile.color_scheme)) {
      colorScheme = profile.color_scheme;
    }
  }

  return (
    <html
      lang="pt-BR"
      data-theme={theme}
      data-mode={colorScheme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
