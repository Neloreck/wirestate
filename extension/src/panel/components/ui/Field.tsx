import { type ReactNode } from "react";

/** A label / value row. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={"flex gap-2"}>
      <span className={"min-w-18 shrink-0 text-fg-muted"}>{label}</span>
      <span className={"break-words"}>{children}</span>
    </div>
  );
}
