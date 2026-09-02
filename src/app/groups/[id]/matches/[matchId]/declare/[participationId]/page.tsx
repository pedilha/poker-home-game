import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeclareForm from "./DeclareForm";

export default async function DeclarePage({
  params,
}: {
  params: Promise<{ id: string; matchId: string; participationId: string }>;
}) {
  const { id, matchId, participationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: match } = await supabase
    .from("matches")
    .select("id, leader_id, status")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) notFound();

  const { data: participation } = await supabase
    .from("participations")
    .select("id, user_id, profiles(display_name, nickname)")
    .eq("id", participationId)
    .returns<
      {
        id: string;
        user_id: string;
        profiles: { display_name: string; nickname: string | null } | null;
      }[]
    >()
    .maybeSingle();
  if (!participation) notFound();

  const isLeader = match.leader_id === user.id;
  const isSelf = participation.user_id === user.id;
  if (!isLeader && !isSelf) notFound();
  if (match.status !== "open") redirect(`/groups/${id}/matches/${matchId}`);

  const { data: snapshot } = await supabase
    .from("match_chip_snapshot")
    .select("id, color_name, color_hex, sort_order")
    .eq("match_id", matchId)
    .order("sort_order")
    .returns<{ id: string; color_name: string; color_hex: string | null }[]>();

  const { data: existingDeclarations } = await supabase
    .from("declarations")
    .select("match_chip_snapshot_id, chip_count")
    .eq("participation_id", participationId)
    .returns<{ match_chip_snapshot_id: string; chip_count: number }[]>();

  const declaredByColor = new Map(
    (existingDeclarations ?? []).map((d) => [d.match_chip_snapshot_id, d.chip_count]),
  );

  const colors = (snapshot ?? []).map((c) => ({
    ...c,
    chipCount: declaredByColor.get(c.id) ?? 0,
  }));

  return (
    <DeclareForm
      groupId={id}
      matchId={matchId}
      participationId={participationId}
      playerLabel={
        participation.profiles?.nickname || participation.profiles?.display_name || "Jogador"
      }
      colors={colors}
    />
  );
}
