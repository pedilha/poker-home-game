"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home, Trophy, Users } from "lucide-react";

export default function GroupBottomNav({ groupId }: { groupId: string }) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Início", icon: Home },
    { href: `/groups/${groupId}`, label: "Grupo", icon: Users },
    { href: `/groups/${groupId}/ranking`, label: "Ranking", icon: Trophy },
    { href: `/groups/${groupId}/history`, label: "Histórico", icon: History },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-sm items-center justify-around">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`flex h-14 flex-1 cursor-pointer items-center justify-center transition-colors ${
                active ? "text-primary" : "text-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
