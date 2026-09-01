import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deleteChipColor,
  updateBuyinValue,
  updateChipColor,
  updateChipUnitValue,
} from "./actions";
import AddChipColorForm from "./AddChipColorForm";

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
    <div className="flex flex-1 flex-col bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div>
          <Link
            href={`/groups/${group.id}`}
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            ← Voltar para {group.name}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Configurações — {group.name}
          </h1>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-500">Buy-in padrão</h2>
          <form
            action={updateBuyinValue.bind(null, group.id)}
            className="flex gap-2"
          >
            <input
              type="text"
              inputMode="decimal"
              name="default_buyin_value"
              required
              defaultValue={group.default_buyin_value}
              className="h-11 w-full rounded-full border border-zinc-300 bg-white px-5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <button className="h-11 rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-50">
              Salvar
            </button>
          </form>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-500">
            Valor da unidade
          </h2>
          <p className="text-xs text-zinc-500">
            Cada cor de ficha vale um número de unidades — mude esse valor
            pra reprecificar o set inteiro de uma vez.
          </p>
          <form
            action={updateChipUnitValue.bind(null, group.id)}
            className="flex gap-2"
          >
            <input
              type="text"
              inputMode="decimal"
              name="chip_unit_value"
              required
              defaultValue={group.chip_unit_value}
              className="h-11 w-full rounded-full border border-zinc-300 bg-white px-5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <button className="h-11 rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-50">
              Salvar
            </button>
          </form>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-500">
            Cores de fichas
          </h2>
          <ul className="space-y-2">
            {(colors ?? []).map((c) => (
              <li
                key={c.id}
                className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <form
                  action={updateChipColor.bind(null, group.id, c.id)}
                  className="flex items-center gap-2"
                >
                  <input
                    type="color"
                    name="color_hex"
                    defaultValue={c.color_hex ?? "#e5e5e5"}
                    className="h-9 w-9 shrink-0 rounded-full border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <input
                    type="text"
                    name="color_name"
                    defaultValue={c.color_name}
                    className="h-9 w-full rounded-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    name="units"
                    defaultValue={c.units}
                    className="h-9 w-20 rounded-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                  <button className="h-9 shrink-0 rounded-full border border-zinc-300 px-3 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-50">
                    Salvar
                  </button>
                </form>
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-zinc-500">
                    {c.units} un × R$ {group.chip_unit_value} = R${" "}
                    {(c.units * group.chip_unit_value).toFixed(2)}
                  </span>
                  <form action={deleteChipColor.bind(null, group.id, c.id)}>
                    <button className="text-xs text-red-600 dark:text-red-400">
                      Remover
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-500">
            Adicionar cor
          </h2>
          <AddChipColorForm groupId={group.id} />
        </div>
      </div>
    </div>
  );
}
