import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    <div className="flex flex-1 flex-col bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div>
          <Link
            href={`/groups/${id}`}
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            ← Voltar para {group.name}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Histórico de partidas
          </h1>
        </div>

        {!matches || matches.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Nenhuma partida fechada ainda.
          </p>
        ) : (
          <ul className="space-y-2">
            {matches.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/groups/${id}/matches/${m.id}`}
                  className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <span className="text-sm text-zinc-900 dark:text-zinc-50">
                    {m.closed_at
                      ? new Date(m.closed_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "—"}{" "}
                    <span className="text-zinc-500">
                      · {m.participations.length} jogador
                      {m.participations.length !== 1 ? "es" : ""}
                    </span>
                  </span>
                  {m.is_divergent && (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      divergente R$ {Math.abs(m.divergence_amount ?? 0).toFixed(2)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
