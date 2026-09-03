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
    <div className="space-y-3">
      {backHref ? (
        <Link
          href={backHref}
          aria-label={backLabel}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
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
