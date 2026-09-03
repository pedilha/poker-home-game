import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addBuyInOrRebuy, resetDeclaration } from "./actions";
import CloseMatchPanel from "./CloseMatchPanel";
import CopyResultsButton from "./CopyResultsButton";
import GroupBottomNav from "@/components/GroupBottomNav";
import { netResult } from "@/lib/poker/reconciliation";
import { Badge, Button, Card, LinkButton, PageContainer, PageHeader } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui/Badge";

const statusLabel: Record<string, string> = {
  playing: "Jogando",
  cashed_out: "Cash-out",
  pending: "Pendente",
};

const statusVariant: Record<string, BadgeVariant> = {
  playing: "neutral",
  cashed_out: "success",
  pending: "warning",
};

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>;
}) {
  const { id, matchId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: match } = await supabase
    .from("matches")
    .select("id, leader_id, status, is_divergent, divergence_amount, buyin_value, closed_at")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) notFound();

  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  if (!group) notFound();

  const isLeader = match.leader_id === user.id;

  const { data: participations } = await supabase
    .from("participations")
    .select("id, user_id, status, rebuys_count, declared_amount, profiles(display_name, nickname)")
    .eq("match_id", matchId)
    .returns<
      {
        id: string;
        user_id: string;
        status: string;
        rebuys_count: number;
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

  const totalInvested = [...investedByParticipation.values()].reduce((a, b) => a + b, 0);
  const totalDeclared = (participations ?? []).reduce(
    (sum, p) => sum + (p.declared_amount ?? 0),
    0,
  );

  const orderedParticipations =
    match.status === "closed"
      ? [...(participations ?? [])].sort(
          (a, b) =>
            netResult(b.declared_amount ?? 0, investedByParticipation.get(b.id) ?? 0) -
            netResult(a.declared_amount ?? 0, investedByParticipation.get(a.id) ?? 0),
        )
      : (participations ?? []);

  const medals = ["🥇", "🥈", "🥉"];

  const resultText =
    match.status === "closed"
      ? [
          `🃏 ${group.name}`,
          `📅 Jogatina do dia ${
            match.closed_at
              ? new Date(match.closed_at).toLocaleDateString("pt-BR")
              : new Date().toLocaleDateString("pt-BR")
          }`,
          "",
          ...orderedParticipations.map((p, index) => {
            const net = netResult(
              p.declared_amount ?? 0,
              investedByParticipation.get(p.id) ?? 0,
            );
            const name = p.profiles?.nickname || p.profiles?.display_name || "Jogador";
            const position = medals[index] ?? `${index + 1}º`;
            const trend = net > 0 ? "📈" : net < 0 ? "📉" : "➖";
            return `${position} ${name} — ${net > 0 ? "+" : ""}R$ ${net.toFixed(2)} ${trend}`;
          }),
        ].join("\n")
      : "";

  const backHref =
    match.status === "closed" ? `/groups/${id}/history` : `/groups/${id}`;
  const backLabel =
    match.status === "closed" ? "Voltar para o histórico" : `Voltar para ${group.name}`;

  return (
    <PageContainer bottomNav nav={<GroupBottomNav groupId={id} />}>
      <PageHeader
        title="Partida"
        backHref={backHref}
        backLabel={backLabel}
        actions={
          <Badge variant={match.status === "open" ? "success" : "neutral"}>
            {match.status === "open" ? "Aberta" : "Fechada"}
          </Badge>
        }
        subtitle={
          match.status === "closed"
            ? match.is_divergent
              ? `Fechada com divergência de R$ ${Math.abs(match.divergence_amount ?? 0).toFixed(2)} — correção proporcional aplicada.`
              : "Fechada sem divergência."
            : undefined
        }
      />

      <ul className="space-y-2">
        {orderedParticipations.map((p, index) => {
          const invested = investedByParticipation.get(p.id) ?? 0;
          const canDeclare = (isLeader || p.user_id === user.id) && match.status === "open";
          const net = netResult(p.declared_amount ?? 0, invested);
          return (
            <Card as="li" key={p.id} className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {match.status === "closed" && (
                    <span className="text-xs font-semibold text-muted">{index + 1}º</span>
                  )}
                  {p.profiles?.nickname || p.profiles?.display_name}
                </span>
                <Badge variant={statusVariant[p.status] ?? "neutral"}>
                  {statusLabel[p.status] ?? p.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between font-mono text-xs text-muted">
                <span>
                  Investido: R$ {invested.toFixed(2)}
                  {p.rebuys_count > 0
                    ? ` (${p.rebuys_count} rebuy${p.rebuys_count > 1 ? "s" : ""})`
                    : ""}
                </span>
                {p.status === "cashed_out" && match.status !== "closed" && (
                  <span>Declarado: R$ {(p.declared_amount ?? 0).toFixed(2)}</span>
                )}
                {match.status === "closed" && (
                  <span
                    className={
                      net > 0 ? "text-success" : net < 0 ? "text-danger" : "text-muted"
                    }
                  >
                    {net > 0 ? "+" : ""}
                    R$ {net.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {isLeader && p.status === "playing" && match.status === "open" && (
                  <form action={addBuyInOrRebuy.bind(null, id, matchId, p.id)}>
                    <Button variant="outline" size="sm">
                      {invested === 0 ? "Buy-in" : "Rebuy"}
                    </Button>
                  </form>
                )}
                {canDeclare && (
                  <LinkButton
                    href={`/groups/${id}/matches/${matchId}/declare/${p.id}`}
                    size="sm"
                  >
                    {p.status === "cashed_out" ? "Editar declaração" : "Declarar"}
                  </LinkButton>
                )}
                {isLeader && p.status === "cashed_out" && match.status === "open" && (
                  <form action={resetDeclaration.bind(null, id, matchId, p.id)}>
                    <Button variant="danger" size="sm">
                      Resetar declaração
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          );
        })}
      </ul>

      {match.status === "closed" && <CopyResultsButton text={resultText} />}

      {match.status === "open" && (
        <p className="text-center font-mono text-xs text-muted">
          Total investido: R$ {totalInvested.toFixed(2)} — Total declarado: R${" "}
          {totalDeclared.toFixed(2)}
        </p>
      )}

      {isLeader && match.status === "open" && (
        <CloseMatchPanel groupId={id} matchId={matchId} />
      )}
    </PageContainer>
  );
}
