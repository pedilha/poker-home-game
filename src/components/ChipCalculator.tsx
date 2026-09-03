"use client";

import { useMemo, useState } from "react";
import { totalDeclaredValue } from "@/lib/poker/reconciliation";
import { Card, EmptyState, LinkButton, PageContainer, PageHeader } from "@/components/ui";

type Color = { id: string; color_name: string; color_hex: string | null; units: number };

export default function ChipCalculator({
  title = "Calculadora",
  subtitle = "Só converte fichas em dinheiro — não afeta ranking ou histórico.",
  backHref,
  backLabel,
  settingsHref,
  chipUnitValue,
  colors,
  bottomNav = false,
}: {
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  settingsHref?: string;
  chipUnitValue: number;
  colors: Color[];
  bottomNav?: boolean;
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
    <PageContainer bottomNav={bottomNav}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        backHref={backHref}
        backLabel={backLabel}
        actions={
          settingsHref ? (
            <LinkButton href={settingsHref} variant="outline" size="sm">
              Editar fichas
            </LinkButton>
          ) : undefined
        }
      />

      {colors.length === 0 ? (
        <EmptyState
          title="Nenhuma cor de ficha configurada"
          description={
            settingsHref
              ? "Configure suas cores pra usar a calculadora."
              : "Peça pro dono configurar em Configurações do grupo."
          }
          action={
            settingsHref ? (
              <LinkButton href={settingsHref} fullWidth>
                Configurar fichas
              </LinkButton>
            ) : undefined
          }
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
