import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Voltar",
  actions,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
    </div>
  );
}
