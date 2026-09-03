import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { approveMember, rejectMember, removeMember, setMemberRole } from "./actions";
import GroupBottomNav from "@/components/GroupBottomNav";
import { Avatar, Badge, Button, Card, LinkButton, PageContainer } from "@/components/ui";

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
      <PageContainer bottomNav nav={<GroupBottomNav groupId={id} />}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-xl font-semibold text-foreground">{group.name}</h1>
          <p className="mt-2 text-sm text-muted">
            Sua solicitação de entrada está aguardando aprovação do dono ou de
            um admin.
          </p>
        </div>
      </PageContainer>
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
    .select("user_id, role, status, profiles(display_name, nickname, avatar_url)")
    .eq("group_id", id)
    .order("joined_at")
    .returns<
      {
        user_id: string;
        role: string;
        status: string;
        profiles: {
          display_name: string;
          nickname: string | null;
          avatar_url: string | null;
        } | null;
      }[]
    >();

  const approvedMembers = (members ?? []).filter((m) => m.status === "approved");
  const pendingMembers = (members ?? []).filter((m) => m.status === "pending");

  return (
    <PageContainer bottomNav nav={<GroupBottomNav groupId={id} />}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{group.name}</h1>
          <p className="mt-1 text-sm text-muted">
            Buy-in padrão: R$ {group.default_buyin_value}
          </p>
          {isAdmin && (
            <p className="mt-1 text-sm text-muted">
              Código de entrada:{" "}
              <span className="font-mono font-semibold text-foreground">
                {group.entry_code}
              </span>
            </p>
          )}
        </div>
        {isOwner && (
          <Link
            href={`/groups/${group.id}/settings`}
            aria-label="Configurações do grupo"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </Link>
        )}
      </div>

      {openMatch ? (
        <LinkButton href={`/groups/${group.id}/matches/${openMatch.id}`} fullWidth>
          Ver partida ativa
        </LinkButton>
      ) : (
        <LinkButton href={`/groups/${group.id}/matches/new`} fullWidth>
          Iniciar partida
        </LinkButton>
      )}

      {isAdmin && pendingMembers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted">Solicitações pendentes</h2>
          <ul className="space-y-2">
            {pendingMembers.map((m) => (
              <Card
                as="li"
                key={m.user_id}
                className="flex items-center justify-between border-dashed px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <Avatar
                    src={m.profiles?.avatar_url}
                    name={m.profiles?.nickname || m.profiles?.display_name || "?"}
                  />
                  {m.profiles?.nickname || m.profiles?.display_name}
                </span>
                <span className="flex gap-2">
                  <form action={approveMember.bind(null, group.id, m.user_id)}>
                    <Button size="sm">Aprovar</Button>
                  </form>
                  <form action={rejectMember.bind(null, group.id, m.user_id)}>
                    <Button variant="outline" size="sm">
                      Recusar
                    </Button>
                  </form>
                </span>
              </Card>
            ))}
          </ul>
        </div>
      )}

      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-medium text-foreground">Membros</h2>
        <ul className="space-y-2">
          {approvedMembers.map((m) => {
            const canRemove =
              m.role !== "owner" &&
              (isOwner || (myMembership.role === "admin" && m.role === "member"));
            return (
              <li
                key={m.user_id}
                className="flex items-center justify-between rounded-xl bg-surface-hover px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <Avatar
                    src={m.profiles?.avatar_url}
                    name={m.profiles?.nickname || m.profiles?.display_name || "?"}
                  />
                  {m.profiles?.nickname || m.profiles?.display_name}
                </span>
                <span className="flex items-center gap-2">
                  <Badge variant={m.role === "owner" ? "success" : "neutral"}>
                    {m.role}
                  </Badge>
                  {isOwner && m.role !== "owner" && (
                    <form
                      action={setMemberRole.bind(
                        null,
                        group.id,
                        m.user_id,
                        m.role === "admin" ? "member" : "admin",
                      )}
                    >
                      <Button variant="outline" size="sm">
                        {m.role === "admin" ? "Tornar membro" : "Tornar admin"}
                      </Button>
                    </form>
                  )}
                  {canRemove && (
                    <form action={removeMember.bind(null, group.id, m.user_id)}>
                      <Button variant="danger" size="sm">
                        Remover
                      </Button>
                    </form>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </PageContainer>
  );
}
