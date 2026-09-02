import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { approveMember, rejectMember, removeMember, setMemberRole } from "./actions";

export default async function GroupPage({
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
    .select("id, name, entry_code, default_buyin_value, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (!group) notFound();

  const { data: myMembership } = await supabase
    .from("group_members")
    .select("status, role")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myMembership) notFound();

  if (myMembership.status === "pending") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 text-center dark:bg-black">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          {group.name}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sua solicitação de entrada está aguardando aprovação do dono ou de
          um admin.
        </p>
      </div>
    );
  }

  const isOwner = myMembership.role === "owner";
  const isAdmin = isOwner || myMembership.role === "admin";

  const { data: openMatch } = await supabase
    .from("matches")
    .select("id")
    .eq("group_id", id)
    .eq("status", "open")
    .maybeSingle();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, role, status, profiles(display_name, nickname)")
    .eq("group_id", id)
    .order("joined_at")
    .returns<
      {
        user_id: string;
        role: string;
        status: string;
        profiles: { display_name: string; nickname: string | null } | null;
      }[]
    >();

  const approvedMembers = (members ?? []).filter((m) => m.status === "approved");
  const pendingMembers = (members ?? []).filter((m) => m.status === "pending");

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {group.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Buy-in padrão: R$ {group.default_buyin_value}
          </p>
          {isAdmin && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Código de entrada: <strong>{group.entry_code}</strong>
            </p>
          )}
          <div className="mt-2 flex gap-3 text-sm">
            <Link
              href={`/groups/${group.id}/ranking`}
              className="text-zinc-600 underline dark:text-zinc-400"
            >
              Ranking
            </Link>
            <Link
              href={`/groups/${group.id}/history`}
              className="text-zinc-600 underline dark:text-zinc-400"
            >
              Histórico
            </Link>
            {isOwner && (
              <Link
                href={`/groups/${group.id}/settings`}
                className="text-zinc-600 underline dark:text-zinc-400"
              >
                Configurações
              </Link>
            )}
          </div>
        </div>

        <div>
          {openMatch ? (
            <Link
              href={`/groups/${group.id}/matches/${openMatch.id}`}
              className="flex h-11 w-full items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Ver partida ativa
            </Link>
          ) : (
            <Link
              href={`/groups/${group.id}/matches/new`}
              className="flex h-11 w-full items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Iniciar partida
            </Link>
          )}
        </div>

        {isAdmin && pendingMembers.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-zinc-500">
              Solicitações pendentes
            </h2>
            <ul className="space-y-2">
              {pendingMembers.map((m) => (
                <li
                  key={m.user_id}
                  className="flex items-center justify-between rounded-2xl border border-dashed border-zinc-300 px-4 py-3 dark:border-zinc-700"
                >
                  <span className="text-sm text-zinc-900 dark:text-zinc-50">
                    {m.profiles?.nickname || m.profiles?.display_name}
                  </span>
                  <span className="flex gap-2">
                    <form action={approveMember.bind(null, group.id, m.user_id)}>
                      <button className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
                        Aprovar
                      </button>
                    </form>
                    <form action={rejectMember.bind(null, group.id, m.user_id)}>
                      <button className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                        Recusar
                      </button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-500">Membros</h2>
          <ul className="space-y-2">
            {approvedMembers.map((m) => {
              const canRemove =
                m.role !== "owner" &&
                (isOwner || (myMembership.role === "admin" && m.role === "member"));
              return (
                <li
                  key={m.user_id}
                  className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <span className="text-sm text-zinc-900 dark:text-zinc-50">
                    {m.profiles?.nickname || m.profiles?.display_name}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{m.role}</span>
                    {isOwner && m.role !== "owner" && (
                      <form
                        action={setMemberRole.bind(
                          null,
                          group.id,
                          m.user_id,
                          m.role === "admin" ? "member" : "admin",
                        )}
                      >
                        <button className="rounded-full border border-zinc-300 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                          {m.role === "admin" ? "Tornar membro" : "Tornar admin"}
                        </button>
                      </form>
                    )}
                    {canRemove && (
                      <form action={removeMember.bind(null, group.id, m.user_id)}>
                        <button className="rounded-full border border-zinc-300 px-2 py-1 text-xs text-red-600 dark:border-zinc-700 dark:text-red-400">
                          Remover
                        </button>
                      </form>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
