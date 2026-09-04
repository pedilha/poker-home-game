"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { totalDeclaredValue } from "@/lib/poker/reconciliation";

export type DeclareState = { error?: string };

export async function declareCashOut(
  groupId: string,
  matchId: string,
  participationId: string,
  _prevState: DeclareState,
  formData: FormData,
): Promise<DeclareState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { data: snapshot } = await supabase
    .from("match_chip_snapshot")
    .select("id, units")
    .eq("match_id", matchId);
  const { data: match } = await supabase
    .from("matches")
    .select("chip_unit_value, buyin_value")
    .eq("id", matchId)
    .maybeSingle();

  if (!match || !snapshot) return { error: "Partida não encontrada." };

  const rows = snapshot.map((s) => {
    const raw = formData.get(`chip_${s.id}`);
    const chipCount =
      typeof raw === "string" && raw.trim() !== "" ? Number(raw) : 0;
    return { snapshotId: s.id, units: s.units, chipCount };
  });

  if (rows.some((r) => !Number.isFinite(r.chipCount) || r.chipCount < 0)) {
    return { error: "Quantidade de fichas inválida." };
  }

  const rawRebuys = formData.get("rebuys");
  const rebuys =
    typeof rawRebuys === "string" && rawRebuys.trim() !== "" ? Number(rawRebuys) : 0;
  if (!Number.isInteger(rebuys) || rebuys < 0) {
    return { error: "Quantidade de rebuys inválida." };
  }

  const declaredAmount = totalDeclaredValue(
    rows.map((r) => ({ chipCount: r.chipCount, units: r.units })),
    match.chip_unit_value,
  );

  await supabase.from("declarations").delete().eq("participation_id", participationId);
  const nonZero = rows.filter((r) => r.chipCount > 0);
  if (nonZero.length > 0) {
    await supabase.from("declarations").insert(
      nonZero.map((r) => ({
        participation_id: participationId,
        match_chip_snapshot_id: r.snapshotId,
        chip_count: r.chipCount,
      })),
    );
  }

  await supabase.from("buyins_rebuys").delete().eq("participation_id", participationId);
  await supabase.from("buyins_rebuys").insert([
    { participation_id: participationId, type: "buy_in", amount: match.buyin_value, created_by: user.id },
    ...Array.from({ length: rebuys }, () => ({
      participation_id: participationId,
      type: "rebuy" as const,
      amount: match.buyin_value,
      created_by: user.id,
    })),
  ]);

  const { error } = await supabase
    .from("participations")
    .update({
      status: "cashed_out",
      declared_amount: declaredAmount,
      declared_at: new Date().toISOString(),
      rebuys_count: rebuys,
    })
    .eq("id", participationId);

  if (error) {
    return { error: "Não foi possível salvar a declaração. Tente novamente." };
  }

  redirect(`/groups/${groupId}/matches/${matchId}`);
}
