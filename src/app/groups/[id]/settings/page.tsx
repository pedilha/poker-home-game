import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deleteChipColor,
  updateBuyinValue,
  updateChipColor,
  updateChipUnitValue,
} from "./actions";
import AddChipColorForm from "./AddChipColorForm";
import { Button, Card, Input, PageContainer, PageHeader } from "@/components/ui";

export default async function GroupSettingsPage({
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
    .select("id, name, owner_id, default_buyin_value, chip_unit_value")
    .eq("id", id)
    .maybeSingle();

  if (!group) notFound();
  if (group.owner_id !== user.id) notFound();

  const { data: colors } = await supabase
    .from("group_chip_colors")
    .select("id, color_name, color_hex, units")
    .eq("group_id", id)
    .order("sort_order")
    .returns<
      { id: string; color_name: string; color_hex: string | null; units: number }[]
    >();

  return (
    <PageContainer>
      <PageHeader
        title="Configurações"
        subtitle={group.name}
        backHref={`/groups/${group.id}`}
        backLabel={`Voltar para ${group.name}`}
      />

      <form action={updateBuyinValue.bind(null, group.id)} className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            type="text"
            inputMode="decimal"
            name="default_buyin_value"
            label="Buy-in padrão (R$)"
            required
            defaultValue={group.default_buyin_value}
          />
        </div>
        <Button variant="outline">Salvar</Button>
      </form>

      <div className="space-y-2">
        <form action={updateChipUnitValue.bind(null, group.id)} className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              type="text"
              inputMode="decimal"
              name="chip_unit_value"
              label="Valor da unidade (R$)"
              required
              defaultValue={group.chip_unit_value}
              hint="Cada cor vale um número de unidades — mude esse valor pra reprecificar o set inteiro de uma vez."
            />
          </div>
          <Button variant="outline">Salvar</Button>
        </form>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted">Cores de fichas</h2>
        <ul className="space-y-2">
          {(colors ?? []).map((c) => (
            <Card as="li" key={c.id} className="space-y-2 p-4">
              <form
                action={updateChipColor.bind(null, group.id, c.id)}
                className="flex items-center gap-2"
              >
                <input
                  type="color"
                  name="color_hex"
                  aria-label="Cor"
                  defaultValue={c.color_hex ?? "#e5e5e5"}
                  className="h-9 w-9 shrink-0 rounded-full border border-border bg-surface"
                />
                <input
                  type="text"
                  name="color_name"
                  aria-label="Nome da cor"
                  defaultValue={c.color_name}
                  className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  name="units"
                  aria-label="Unidades"
                  defaultValue={c.units}
                  className="h-9 w-16 shrink-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
                />
                <Button size="sm" variant="secondary" className="shrink-0">
                  Salvar
                </Button>
              </form>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted">
                  {c.units} un × R$ {group.chip_unit_value} = R${" "}
                  {(c.units * group.chip_unit_value).toFixed(2)}
                </span>
                <form action={deleteChipColor.bind(null, group.id, c.id)}>
                  <button className="cursor-pointer text-xs text-danger transition-colors hover:underline">
                    Remover
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted">Adicionar cor</h2>
        <AddChipColorForm groupId={group.id} />
      </div>
    </PageContainer>
  );
}
