import { notFound, redirect } from "next/navigation";
import { Calculator, History, Settings, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { approveMember, rejectMember, removeMember, setMemberRole } from "./actions";
import { Badge, Button, Card, LinkButton, PageContainer } from "@/components/ui";

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
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-semibold text-foreground">{group.name}</h1>
        <p className="mt-2 text-sm text-muted">
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

  const navTiles = [
    { href: `/groups/${group.id}/ranking`, label: "Ranking", icon: Trophy },
    { href: `/groups/${group.id}/history`, label: "Histórico", icon: History },
    { href: `/groups/${group.id}/calculator`, label: "Calculadora", icon: Calculator },
    ...(isOwner
      ? [{ href: `/groups/${group.id}/settings`, label: "Config.", icon: Settings }]
      : []),
  ];

  return (
    <PageContainer>
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

      <div className={`grid gap-2 ${navTiles.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
        {navTiles.map((tile) => (
          <LinkButton
            key={tile.href}
            href={tile.href}
            variant="outline"
            className="h-auto flex-col gap-1.5 rounded-2xl py-3 text-xs"
          >
            <tile.icon className="h-4 w-4" aria-hidden="true" />
            {tile.label}
          </LinkButton>
        ))}
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
                <span className="text-sm text-foreground">
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

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted">Membros</h2>
        <ul className="space-y-2">
          {approvedMembers.map((m) => {
            const canRemove =
              m.role !== "owner" &&
              (isOwner || (myMembership.role === "admin" && m.role === "member"));
            return (
              <Card as="li" key={m.user_id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-foreground">
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
              </Card>
            );
          })}
        </ul>
      </div>
    </PageContainer>
  );
}
