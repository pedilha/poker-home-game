import type { ReactNode } from "react";

export default function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-1 flex-col px-4 py-10">
      <div className={`mx-auto w-full max-w-sm space-y-8 ${className}`}>{children}</div>
    </div>
  );
}
