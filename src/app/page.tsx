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
    .select("status, groups(id, name, cover_image_url)")
    .eq("user_id", user.id)
    .returns<
      {
        status: string;
        groups: { id: string; name: string; cover_image_url: string | null } | null;
      }[]
    >();

  const approved = (memberships ?? []).filter((m) => m.status === "approved");
  const pending = (memberships ?? []).filter((m) => m.status === "pending");
  const hasGroups = approved.length > 0 || pending.length > 0;

  return (
    <PageContainer bottomNav>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Seus grupos</h1>
        <Link
          href="/groups/add"
          aria-label="Adicionar grupo"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-surface-hover"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      {!hasGroups ? (
        <EmptyState
          title="Você ainda não faz parte de nenhum grupo"
          description="Crie um grupo novo ou entre em um usando o código de entrada."
          action={
            <LinkButton href="/groups/add" fullWidth>
              Adicionar grupo
            </LinkButton>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {approved.map((m) =>
            m.groups ? (
              <Link key={m.groups.id} href={`/groups/${m.groups.id}`}>
                <Card className="overflow-hidden p-0 transition-colors hover:bg-surface-hover">
                  <p className="truncate px-3 py-2 text-sm font-medium text-foreground">
                    {m.groups.name}
                  </p>
                  <div className="flex aspect-square w-full items-center justify-center bg-surface-hover">
                    {m.groups.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.groups.cover_image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Users className="h-8 w-8 text-muted" aria-hidden="true" />
                    )}
                  </div>
                </Card>
              </Link>
            ) : null,
          )}
          {pending.map((m) =>
            m.groups ? (
              <Card key={m.groups.id} className="overflow-hidden border-dashed p-0">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {m.groups.name}
                  </p>
                  <Badge variant="warning">aguardando</Badge>
                </div>
                <div className="flex aspect-square w-full items-center justify-center bg-surface-hover">
                  <Users className="h-8 w-8 text-muted" aria-hidden="true" />
                </div>
              </Card>
            ) : null,
          )}
        </div>
      )}
    </PageContainer>
  );
}
