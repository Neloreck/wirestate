import { type PropsWithChildren, type ReactNode } from "react";

/** A titled block within a Detail view. */
export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section className={"space-y-1"}>
      <h4 className={"text-[10px] uppercase tracking-wide text-fg-muted"}>{title}</h4>
      <div className={"space-y-0.5"}>{children}</div>
    </section>
  );
}

/** A label / value row. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={"flex gap-2"}>
      <span className={"min-w-[72px] shrink-0 text-fg-muted"}>{label}</span>
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

/** A small lifecycle chip for a singleton instance binding (`active` / `inactive` / `unrealized`). */
export function StatusTag({ status }: { status: "active" | "inactive" | "unrealized" }) {
  const tone: string =
    status === "active"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : status === "inactive"
        ? "bg-zinc-500/20 text-fg-muted"
        : "bg-amber-500/15 text-amber-600 dark:text-amber-400";

  return <span className={`rounded px-1 text-[10px] uppercase tracking-wide ${tone}`}>{status}</span>;
}

/** The "filter the Timeline to this container" cross-link shown at the foot of a Detail view. */
export function FilterToContainerLink({ onClick }: { onClick: () => void }) {
  return (
    <div>
      <LinkButton onClick={onClick}>⤵ Filter Timeline to this container</LinkButton>
    </div>
  );
}
