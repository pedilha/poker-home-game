import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addBuyInOrRebuy, resetDeclaration } from "./actions";
import CloseMatchPanel from "./CloseMatchPanel";

const statusLabel: Record<string, string> = {
  playing: "Jogando",
  cashed_out: "Cash-out",
  pending: "Pendente",
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
    <div className="flex flex-1 flex-col bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div>
          <Link
            href={`/groups/${id}`}
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            ← Voltar para {group.name}
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              Partida
            </h1>
            <span className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
              {match.status === "open" ? "Aberta" : "Fechada"}
            </span>
          </div>
          {match.status === "closed" && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {match.is_divergent
                ? `Fechada com divergência de R$ ${Math.abs(match.divergence_amount ?? 0).toFixed(2)} — correção proporcional aplicada.`
                : "Fechada sem divergência."}
            </p>
          )}
        </div>

        <ul className="space-y-2">
          {(participations ?? []).map((p) => {
            const invested = investedByParticipation.get(p.id) ?? 0;
            const canDeclare = (isLeader || p.user_id === user.id) && match.status === "open";
            return (
              <li
                key={p.id}
                className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {p.profiles?.nickname || p.profiles?.display_name}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {statusLabel[p.status] ?? p.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    Investido: R$ {invested.toFixed(2)}
                    {p.rebuys_count > 0 ? ` (${p.rebuys_count} rebuy${p.rebuys_count > 1 ? "s" : ""})` : ""}
                  </span>
                  {p.status === "cashed_out" && (
                    <span>Declarado: R$ {(p.declared_amount ?? 0).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {isLeader && p.status === "playing" && match.status === "open" && (
                    <form action={addBuyInOrRebuy.bind(null, id, matchId, p.id)}>
                      <button className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                        {invested === 0 ? "Buy-in" : "Rebuy"}
                      </button>
                    </form>
                  )}
                  {canDeclare && (
                    <Link
                      href={`/groups/${id}/matches/${matchId}/declare/${p.id}`}
                      className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background"
                    >
                      {p.status === "cashed_out" ? "Editar declaração" : "Declarar"}
                    </Link>
                  )}
                  {isLeader && p.status === "cashed_out" && match.status === "open" && (
                    <form action={resetDeclaration.bind(null, id, matchId, p.id)}>
                      <button className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-red-600 dark:border-zinc-700 dark:text-red-400">
                        Resetar declaração
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {match.status === "open" && (
          <div className="space-y-1 text-center text-xs text-zinc-500">
            <p>
              Total investido: R$ {totalInvested.toFixed(2)} — Total
              declarado: R$ {totalDeclared.toFixed(2)}
            </p>
          </div>
        )}

        {isLeader && match.status === "open" && (
          <CloseMatchPanel groupId={id} matchId={matchId} />
        )}
      </div>
    </div>
  );
}
