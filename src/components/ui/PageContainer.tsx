import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";

export default function PageContainer({
  children,
  className = "",
  bottomNav = false,
  nav,
}: {
  children: ReactNode;
  className?: string;
  bottomNav?: boolean;
  nav?: ReactNode;
}) {
  return (
    <div className={`flex flex-1 flex-col px-4 py-10 ${bottomNav ? "pb-24" : ""}`}>
      <div className={`mx-auto w-full max-w-sm space-y-8 ${className}`}>{children}</div>
      {bottomNav ? (nav ?? <BottomNav />) : null}
    </div>
  );
}
