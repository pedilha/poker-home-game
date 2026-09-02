"use client";

import { useMemo, useState } from "react";
import { totalDeclaredValue } from "@/lib/poker/reconciliation";
import { Card, EmptyState, PageContainer, PageHeader } from "@/components/ui";

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
    <PageContainer>
      <PageHeader
        title="Calculadora"
        subtitle="Só converte fichas em dinheiro — não afeta ranking ou histórico."
        backHref={`/groups/${groupId}`}
        backLabel={`Voltar para ${groupName}`}
      />

      {colors.length === 0 ? (
        <EmptyState
          title="Esse grupo ainda não tem cores de fichas configuradas"
          description="Peça pro dono configurar em Configurações do grupo."
        />
      ) : (
        <>
          <div className="space-y-3">
            {colors.map((c) => {
              const inputId = `calc_${c.id}`;
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: c.color_hex ?? undefined }}
                    aria-hidden="true"
                  />
                  <label htmlFor={inputId} className="w-24 shrink-0 text-sm text-foreground">
                    {c.color_name}
                  </label>
                  <input
                    id={inputId}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={counts[c.id] ?? ""}
                    onChange={(e) =>
                      setCounts((prev) => ({ ...prev, [c.id]: e.target.value }))
                    }
                    className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              );
            })}
          </div>

          <Card className="p-4 text-center">
            <p className="text-xs text-muted">Total</p>
            <p className="font-mono text-2xl font-semibold text-foreground">
              R$ {total.toFixed(2)}
            </p>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
