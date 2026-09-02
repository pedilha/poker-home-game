import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { round2 } from "@/lib/poker/reconciliation";
import { rankPlayers, type PlayerScore } from "@/lib/poker/ranking";
import RankingTabs from "./RankingTabs";

export default async function RankingPage({
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
    .select("id, name")
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

  const { data: matches } = await supabase
    .from("matches")
    .select("id, closed_at")
    .eq("group_id", id)
    .eq("status", "closed")
    .returns<{ id: string; closed_at: string | null }[]>();

  const matchIds = (matches ?? []).map((m) => m.id);
  const closedAtByMatch = new Map(
    (matches ?? []).map((m) => [m.id, m.closed_at ? new Date(m.closed_at) : null]),
  );

  const { data: participations } = await supabase
    .from("participations")
    .select("id, match_id, user_id, declared_amount, profiles(display_name, nickname)")
    .in("match_id", matchIds.length > 0 ? matchIds : [""])
    .returns<
      {
        id: string;
        match_id: string;
        user_id: string;
        declared_amount: number | null;
        profiles: { display_name: string; nickname: string | null } | null;
      }[]
    >();

  const participationIds = (participations ?? []).map((p) => p.id);
  const { data: buyins } = await supabase
    .from("buyins_rebuys")
    .select("participation_id, amount")
    .in("participation_id", participationIds.length > 0 ? participationIds : [""]);

  const investedByParticipation = new Map<string, number>();
  for (const b of buyins ?? []) {
    investedByParticipation.set(
      b.participation_id,
      (investedByParticipation.get(b.participation_id) ?? 0) + b.amount,
    );
  }

  const now = new Date();

  function buildRanking(filter: (matchDate: Date | null) => boolean) {
    const totals = new Map<string, { label: string; net: number }>();

    for (const p of participations ?? []) {
      const matchDate = closedAtByMatch.get(p.match_id) ?? null;
      if (!filter(matchDate)) continue;

      const invested = investedByParticipation.get(p.id) ?? 0;
      const net = (p.declared_amount ?? 0) - invested;
      const label = p.profiles?.nickname || p.profiles?.display_name || "Jogador";

      const current = totals.get(p.user_id) ?? { label, net: 0 };
      totals.set(p.user_id, { label, net: round2(current.net + net) });
    }

    const scores: PlayerScore[] = [...totals.entries()].map(([playerId, t]) => ({
      playerId,
      netTotal: t.net,
    }));

    return rankPlayers(scores).map((r) => ({
      ...r,
      label: totals.get(r.playerId)!.label,
    }));
  }

  const monthRanking = buildRanking(
    (d) => !!d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(),
  );
  const yearRanking = buildRanking((d) => !!d && d.getFullYear() === now.getFullYear());
  const totalRanking = buildRanking(() => true);

  return (
    <RankingTabs
      groupId={id}
      groupName={group.name}
      month={monthRanking}
      year={yearRanking}
      total={totalRanking}
    />
  );
}
