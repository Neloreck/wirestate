import type { PropsWithChildren, ReactNode } from "react";

/** A titled block within a Detail view. */
export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section className={"space-y-1"}>
      <h4 className={"text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400"}>{title}</h4>
      <div className={"space-y-0.5"}>{children}</div>
    </section>
  );
}

/** A label / value row. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={"flex gap-2"}>
      <span className={"min-w-[72px] shrink-0 text-neutral-500 dark:text-neutral-400"}>{label}</span>
      <span className={"break-words"}>{children}</span>
    </div>
  );
}

/** An inline link-styled button (for drill-in / cross-link actions). */
export function LinkButton({ onClick, children }: PropsWithChildren<{ onClick: () => void }>) {
  return (
    <button type={"button"} onClick={onClick} className={"text-left text-sky-600 hover:underline dark:text-sky-400"}>
      {children}
    </button>
  );
}
