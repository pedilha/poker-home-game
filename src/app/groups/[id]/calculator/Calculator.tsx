"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { totalDeclaredValue } from "@/lib/poker/reconciliation";

type Color = { id: string; color_name: string; color_hex: string | null; units: number };

export default function Calculator({
  groupId,
  groupName,
  chipUnitValue,
  colors,
}: {
  groupId: string;
  groupName: string;
  chipUnitValue: number;
  colors: Color[];
}) {
  const [counts, setCounts] = useState<Record<string, string>>({});

  const total = useMemo(() => {
    const declarations = colors.map((c) => ({
      chipCount: Number(counts[c.id]?.replace(",", ".")) || 0,
      units: c.units,
    }));
    return totalDeclaredValue(declarations, chipUnitValue);
  }, [counts, colors, chipUnitValue]);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div>
          <Link
            href={`/groups/${groupId}`}
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            ← Voltar para {groupName}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Calculadora
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Só converte fichas em dinheiro — não afeta ranking ou histórico.
          </p>
        </div>

        {colors.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Esse grupo ainda não tem cores de fichas configuradas.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {colors.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border border-zinc-300"
                    style={{ backgroundColor: c.color_hex ?? undefined }}
                  />
                  <span className="w-24 shrink-0 text-sm text-zinc-700 dark:text-zinc-300">
                    {c.color_name}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={counts[c.id] ?? ""}
                    onChange={(e) =>
                      setCounts((prev) => ({ ...prev, [c.id]: e.target.value }))
                    }
                    className="h-11 w-full rounded-full border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs text-zinc-500">Total</p>
              <p className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                R$ {total.toFixed(2)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
