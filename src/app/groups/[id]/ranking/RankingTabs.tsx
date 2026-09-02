"use client";

import { useState } from "react";
import Link from "next/link";

type Row = { playerId: string; netTotal: number; position: number; label: string };

const TABS = [
  { key: "month", label: "Mês" },
  { key: "year", label: "Ano" },
  { key: "total", label: "Total" },
] as const;

export default function RankingTabs({
  groupId,
  groupName,
  month,
  year,
  total,
}: {
  groupId: string;
  groupName: string;
  month: Row[];
  year: Row[];
  total: Row[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("total");
  const data = { month, year, total }[tab];

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
            Ranking
          </h1>
        </div>

        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`h-9 flex-1 rounded-full text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-foreground text-background"
                  : "border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {data.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Nenhuma partida fechada nesse período.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.map((r) => (
              <li
                key={r.playerId}
                className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <span className="flex items-center gap-3">
                  <span className="w-6 text-sm font-semibold text-zinc-500">
                    {r.position}º
                  </span>
                  <span className="text-sm text-zinc-900 dark:text-zinc-50">
                    {r.label}
                  </span>
                </span>
                <span
                  className={`text-sm font-medium ${
                    r.netTotal > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : r.netTotal < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-zinc-500"
                  }`}
                >
                  {r.netTotal > 0 ? "+" : ""}
                  R$ {r.netTotal.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
