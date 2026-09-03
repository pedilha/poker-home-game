import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChipCalculator from "@/components/ChipCalculator";

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, chip_unit_value")
    .eq("id", id)
    .maybeSingle();
  if (!group) notFound();

  const { data: myMembership } = await supabase
    .from("group_members")
    .select("status")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!myMembership || myMembership.status !== "approved") notFound();

  const { data: colors } = await supabase
    .from("group_chip_colors")
    .select("id, color_name, color_hex, units")
    .eq("group_id", id)
    .order("sort_order")
    .returns<
      { id: string; color_name: string; color_hex: string | null; units: number }[]
    >();

  return (
    <ChipCalculator
      backHref={`/groups/${id}`}
      backLabel={`Voltar para ${group.name}`}
      chipUnitValue={group.chip_unit_value}
      colors={colors ?? []}
    />
  );
}
