import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, LinkButton, PageContainer } from "@/components/ui";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("group_members")
    .select("status, groups(id, name)")
    .eq("user_id", user.id)
    .returns<{ status: string; groups: { id: string; name: string } | null }[]>();

  const approved = (memberships ?? []).filter((m) => m.status === "approved");
  const pending = (memberships ?? []).filter((m) => m.status === "pending");
  const hasGroups = approved.length > 0 || pending.length > 0;

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Seus grupos</h1>
        {hasGroups ? (
          <LinkButton href="/groups/new" variant="outline" size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Criar
          </LinkButton>
        ) : null}
      </div>

      {!hasGroups ? (
        <EmptyState
          title="Você ainda não faz parte de nenhum grupo"
          description="Crie um grupo novo ou entre em um usando o código de entrada."
          action={
            <div className="flex w-full flex-col gap-3 pt-2">
              <LinkButton href="/groups/new" fullWidth>
                Criar grupo
              </LinkButton>
              <LinkButton href="/groups/join" variant="outline" fullWidth>
                Entrar com código
              </LinkButton>
            </div>
          }
        />
      ) : (
        <>
          <ul className="space-y-2">
            {approved.map((m) =>
              m.groups ? (
                <li key={m.groups.id}>
                  <Link href={`/groups/${m.groups.id}`}>
                    <Card className="flex h-14 items-center gap-3 px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover">
                      <Users className="h-4 w-4 text-muted" aria-hidden="true" />
                      {m.groups.name}
                    </Card>
                  </Link>
                </li>
              ) : null,
            )}
            {pending.map((m) =>
              m.groups ? (
                <li key={m.groups.id}>
                  <Card className="flex h-14 items-center justify-between border-dashed px-5 text-sm text-muted">
                    {m.groups.name}
                    <Badge variant="warning">aguardando</Badge>
                  </Card>
                </li>
              ) : null,
            )}
          </ul>

          <LinkButton href="/groups/join" variant="ghost" size="sm">
            Entrar em outro grupo com código
          </LinkButton>
        </>
      )}
    </PageContainer>
  );
}
