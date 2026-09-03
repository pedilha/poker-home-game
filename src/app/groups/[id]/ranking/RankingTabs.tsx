"use client";

import { useState } from "react";
import GroupBottomNav from "@/components/GroupBottomNav";
import { Avatar, EmptyState, PageContainer } from "@/components/ui";

type Row = {
  playerId: string;
  netTotal: number;
  position: number;
  label: string;
  avatarUrl: string | null;
};

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
    <PageContainer bottomNav nav={<GroupBottomNav groupId={groupId} />}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Ranking</h1>
        <p className="mt-1 text-sm text-muted">{groupName}</p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`h-9 flex-1 cursor-pointer rounded-full text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted hover:bg-surface-hover"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="Nenhuma partida fechada nesse período"
          description="O ranking atualiza assim que uma partida for fechada."
        />
      ) : (
        <ul className="space-y-2">
          {data.map((r) => (
            <li
              key={r.playerId}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3"
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-sm font-semibold text-muted">{r.position}º</span>
                <Avatar src={r.avatarUrl} name={r.label} />
                <span className="text-sm text-foreground">{r.label}</span>
              </span>
              <span
                className={`font-mono text-sm font-medium ${
                  r.netTotal > 0 ? "text-success" : r.netTotal < 0 ? "text-danger" : "text-muted"
                }`}
              >
                {r.netTotal > 0 ? "+" : ""}
                R$ {r.netTotal.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
