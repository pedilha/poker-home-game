import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, PageContainer, PageHeader } from "@/components/ui";

export default async function HistoryPage({
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
    .select("id, closed_at, is_divergent, divergence_amount, participations(id)")
    .eq("group_id", id)
    .eq("status", "closed")
    .order("closed_at", { ascending: false })
    .returns<
      {
        id: string;
        closed_at: string | null;
        is_divergent: boolean;
        divergence_amount: number | null;
        participations: { id: string }[];
      }[]
    >();

  return (
    <PageContainer>
      <PageHeader
        title="Histórico de partidas"
        backHref={`/groups/${id}`}
        backLabel={`Voltar para ${group.name}`}
      />

      {!matches || matches.length === 0 ? (
        <EmptyState
          title="Nenhuma partida fechada ainda"
          description="Partidas fechadas aparecem aqui, com a data e se houve divergência."
        />
      ) : (
        <ul className="space-y-2">
          {matches.map((m) => (
            <li key={m.id}>
              <Link href={`/groups/${id}/matches/${m.id}`}>
                <Card className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-hover">
                  <span className="text-sm text-foreground">
                    {m.closed_at
                      ? new Date(m.closed_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "—"}{" "}
                    <span className="text-muted">
                      · {m.participations.length} jogador
                      {m.participations.length !== 1 ? "es" : ""}
                    </span>
                  </span>
                  {m.is_divergent && (
                    <Badge variant="warning">
                      divergente R$ {Math.abs(m.divergence_amount ?? 0).toFixed(2)}
                    </Badge>
                  )}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
