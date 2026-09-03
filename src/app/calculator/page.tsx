import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChipCalculator from "@/components/ChipCalculator";

type ColorRow = { id: string; color_name: string; color_hex: string | null; units: number };

const DEFAULT_COLORS = [
  { color_name: "Branco", color_hex: "#f5f5f5", units: 1, sort_order: 1 },
  { color_name: "Verde", color_hex: "#16a34a", units: 5, sort_order: 2 },
  { color_name: "Azul", color_hex: "#2563eb", units: 10, sort_order: 3 },
  { color_name: "Preto", color_hex: "#171717", units: 25, sort_order: 4 },
  { color_name: "Vermelho", color_hex: "#dc2626", units: 50, sort_order: 5 },
];

export default async function PersonalCalculatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("calculator_unit_value")
    .eq("id", user.id)
    .maybeSingle();

  let { data: colors } = await supabase
    .from("calculator_chip_colors")
    .select("id, color_name, color_hex, units")
    .eq("user_id", user.id)
    .order("sort_order")
    .returns<ColorRow[]>();

  if (!colors || colors.length === 0) {
    const { data: inserted } = await supabase
      .from("calculator_chip_colors")
      .insert(DEFAULT_COLORS.map((c) => ({ ...c, user_id: user.id })))
      .select("id, color_name, color_hex, units")
      .order("sort_order")
      .returns<ColorRow[]>();
    colors = inserted ?? [];
  }

  return (
    <ChipCalculator
      title="Minha calculadora"
      subtitle="Config só sua, não depende de nenhum grupo."
      settingsHref="/calculator/settings"
      chipUnitValue={profile?.calculator_unit_value ?? 0.1}
      colors={colors}
      bottomNav
    />
  );
}
