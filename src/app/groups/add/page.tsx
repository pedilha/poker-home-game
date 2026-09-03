import { Plus, Users } from "lucide-react";
import { LinkButton, PageContainer, PageHeader } from "@/components/ui";

export default function AddGroupPage() {
  return (
    <PageContainer>
      <PageHeader title="Adicionar grupo" backHref="/" backLabel="Voltar para o início" />

      <div className="flex flex-col gap-3">
        <LinkButton href="/groups/new" fullWidth className="h-14">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Criar grupo
        </LinkButton>
        <LinkButton href="/groups/join" variant="outline" fullWidth className="h-14">
          <Users className="h-4 w-4" aria-hidden="true" />
          Entrar com código
        </LinkButton>
      </div>
    </PageContainer>
  );
}
