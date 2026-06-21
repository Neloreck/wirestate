import { type ReactNode } from "react";

interface FieldProps {
  readonly label: string;
  readonly children: ReactNode;
}

/**
 * A label / value row.
 */
export function Field({ label, children }: FieldProps) {
  return (
    <div className={"flex gap-2"}>
      <span className={"min-w-18 shrink-0 text-fg-muted"}>{label}</span>
      <span className={"wrap-break-word"}>{children}</span>
    </div>
  );
}
