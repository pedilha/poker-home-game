import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addBuyInOrRebuy, resetDeclaration } from "./actions";
import CloseMatchPanel from "./CloseMatchPanel";
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
    .select("id, leader_id, status, is_divergent, divergence_amount, buyin_value")
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

  return (
    <PageContainer>
      <PageHeader
        title="Partida"
        backHref={`/groups/${id}`}
        backLabel={`Voltar para ${group.name}`}
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
        {(participations ?? []).map((p) => {
          const invested = investedByParticipation.get(p.id) ?? 0;
          const canDeclare = (isLeader || p.user_id === user.id) && match.status === "open";
          return (
            <Card as="li" key={p.id} className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
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
                {p.status === "cashed_out" && (
                  <span>Declarado: R$ {(p.declared_amount ?? 0).toFixed(2)}</span>
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
