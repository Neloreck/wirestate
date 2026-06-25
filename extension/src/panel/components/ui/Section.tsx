import { type PropsWithChildren, type ReactNode } from "react";

import { cn } from "@/lib/class-name";

interface SectionProps extends PropsWithChildren {
  readonly title?: string;
  readonly icon?: ReactNode;
  readonly count?: number;
  readonly anchor?: boolean;
}

/**
 * A titled block within a detail view.
 * Non-anchor sections are separated from the previous block by a hairline top rule (suppressed for the first child),
 * so regions read as distinct at a glance.
 */
export function Section({ title, icon, count, anchor = false, children }: SectionProps) {
  const frame: string = anchor ? "space-y-1" : "space-y-1 pt-2 first:border-t-0 first:pt-0";

  return (
    <section className={frame}>
      {title || icon ? (
        <h4
          className={cn(
            "flex items-center gap-1.5 font-bold tracking-wide text-fg uppercase",
            anchor ? "text-sm" : "text-xs"
          )}
        >
          {icon ? <span className={"shrink-0 text-fg-subtle [&>svg]:size-icon"}>{icon}</span> : null}

          <span>{title}</span>

          {typeof count === "number" ? (
            <span className={"rounded bg-selected px-1 text-2xs text-fg-muted tabular-nums"}>{count}</span>
          ) : null}
        </h4>
      ) : null}

      <div className={"space-y-0.5"}>{children}</div>
    </section>
  );
}
