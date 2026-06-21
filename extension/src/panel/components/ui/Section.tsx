import { type PropsWithChildren } from "react";

/** A titled block within a detail view. */
export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section className={"space-y-1"}>
      <h4 className={"text-2xs tracking-wide text-fg-muted uppercase"}>{title}</h4>
      <div className={"space-y-0.5"}>{children}</div>
    </section>
  );
}
