import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteChipColor, updateChipColor, updateCalculatorUnitValue } from "./actions";
import AddChipColorForm from "./AddChipColorForm";
import { Button, Card, EmptyState, Input, PageContainer, PageHeader } from "@/components/ui";

export default async function CalculatorSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("calculator_unit_value")
    .eq("id", user.id)
    .maybeSingle();

  const { data: colors } = await supabase
    .from("calculator_chip_colors")
    .select("id, color_name, color_hex, units")
    .eq("user_id", user.id)
    .order("sort_order")
    .returns<
      { id: string; color_name: string; color_hex: string | null; units: number }[]
    >();

  const unitValue = profile?.calculator_unit_value ?? 0.1;

  return (
    <PageContainer>
      <PageHeader
        title="Minhas fichas"
        subtitle="Config usada só na sua calculadora pessoal."
        backHref="/calculator"
        backLabel="Voltar para a calculadora"
      />

      <div className="space-y-2">
        <form action={updateCalculatorUnitValue} className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              type="text"
              inputMode="decimal"
              name="calculator_unit_value"
              label="Valor da unidade (R$)"
              required
              defaultValue={unitValue}
              hint="Cada cor vale um número de unidades — mude esse valor pra reprecificar tudo de uma vez."
            />
          </div>
          <Button variant="outline">Salvar</Button>
        </form>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted">Cores de fichas</h2>
        {(colors ?? []).length === 0 && (
          <EmptyState
            title="Nenhuma cor configurada"
            description="Adicione uma cor abaixo pra voltar a usar a calculadora."
          />
        )}
        <ul className="space-y-2">
          {(colors ?? []).map((c) => (
            <Card as="li" key={c.id} className="space-y-2 p-4">
              <form action={updateChipColor.bind(null, c.id)} className="flex items-center gap-2">
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
                  {c.units} un × R$ {unitValue} = R$ {(c.units * unitValue).toFixed(2)}
                </span>
                <form action={deleteChipColor.bind(null, c.id)}>
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
        <AddChipColorForm />
      </div>
    </PageContainer>
  );
}
