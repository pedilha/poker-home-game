"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  applyProportionalCorrection,
  proportionalCorrectionFactor,
  reconcileMatch,
} from "@/lib/poker/reconciliation";

export type CloseMatchResult =
  | { closed: true }
  | {
      closed: false;
      pendingDeclarations: number;
    }
  | {
      closed: false;
      isDivergent: true;
      totalInvested: number;
      totalDeclared: number;
      divergenceAmount: number;
    };

export async function closeMatch(
  groupId: string,
  matchId: string,
  _prevState: CloseMatchResult | null,
  _formData: FormData,
): Promise<CloseMatchResult> {
  const supabase = await createClient();

  const { data: participations } = await supabase
    .from("participations")
    .select("id, status, declared_amount")
    .eq("match_id", matchId);

  const pendingDeclarations = (participations ?? []).filter(
    (p) => p.status !== "cashed_out",
  ).length;
  if (pendingDeclarations > 0) {
    return { closed: false, pendingDeclarations };
  }

  const participationIds = (participations ?? []).map((p) => p.id);
  const { data: buyins } = await supabase
    .from("buyins_rebuys")
    .select("amount")
    .in("participation_id", participationIds);

  const totalInvested = (buyins ?? []).reduce((sum, b) => sum + b.amount, 0);
  const totalDeclared = (participations ?? []).reduce(
    (sum, p) => sum + (p.declared_amount ?? 0),
    0,
  );

  const { isDivergent, divergenceAmount } = reconcileMatch(
    totalInvested,
    totalDeclared,
  );

  if (!isDivergent) {
    await supabase
      .from("matches")
      .update({ status: "closed", is_divergent: false, closed_at: new Date().toISOString() })
      .eq("id", matchId);
    revalidatePath(`/groups/${groupId}/matches/${matchId}`);
    revalidatePath(`/groups/${groupId}`);
    return { closed: true };
  }

  return { closed: false, isDivergent: true, totalInvested, totalDeclared, divergenceAmount };
}

export async function closeWithProportionalCorrection(
  groupId: string,
  matchId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: participations } = await supabase
    .from("participations")
    .select("id, declared_amount")
    .eq("match_id", matchId);

  const participationIds = (participations ?? []).map((p) => p.id);
  const { data: buyins } = await supabase
    .from("buyins_rebuys")
    .select("amount")
    .in("participation_id", participationIds);

  const totalInvested = (buyins ?? []).reduce((sum, b) => sum + b.amount, 0);
  const totalDeclared = (participations ?? []).reduce(
    (sum, p) => sum + (p.declared_amount ?? 0),
    0,
  );

  const factor = proportionalCorrectionFactor(totalInvested, totalDeclared);
  const { divergenceAmount } = reconcileMatch(totalInvested, totalDeclared);

  const before = (participations ?? []).map((p) => ({
    participation_id: p.id,
    declared_amount: p.declared_amount,
  }));

  for (const p of participations ?? []) {
    const corrected = applyProportionalCorrection(p.declared_amount ?? 0, factor);
    await supabase
      .from("participations")
      .update({ declared_amount: corrected })
      .eq("id", p.id);
  }

  await supabase
    .from("matches")
    .update({
      status: "closed",
      is_divergent: true,
      divergence_amount: divergenceAmount,
      closed_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  await supabase.from("audit_log").insert({
    match_id: matchId,
    actor_id: user.id,
    action: "proportional_correction",
    before: { total_invested: totalInvested, total_declared: totalDeclared, participations: before },
    after: { correction_factor: factor },
  });

  revalidatePath(`/groups/${groupId}/matches/${matchId}`);
  revalidatePath(`/groups/${groupId}`);
}

export async function resetDeclaration(
  groupId: string,
  matchId: string,
  participationId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("declarations").delete().eq("participation_id", participationId);
  await supabase
    .from("participations")
    .update({ status: "playing", declared_amount: null, declared_at: null })
    .eq("id", participationId);

  await supabase.from("audit_log").insert({
    match_id: matchId,
    actor_id: user.id,
    action: "reset_declaration",
    target_participation_id: participationId,
  });

  revalidatePath(`/groups/${groupId}/matches/${matchId}`);
}
