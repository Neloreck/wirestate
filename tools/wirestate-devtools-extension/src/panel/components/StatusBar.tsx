import type { Optional } from "@/types/general";

interface StatusBarProps {
  readonly connected: boolean;
  readonly protocolVersion: Optional<number>;
  readonly rootCount: number;
  readonly containerCount: number;
}

/** Thin top bar: connection status, protocol version, and tree counts. */
export function StatusBar({ connected, protocolVersion, rootCount, containerCount }: StatusBarProps) {
  return (
    <header
      className={
        "flex items-center gap-2.5 border-b border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-neutral-700 dark:bg-neutral-800"
      }
    >
      <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
      <strong className={"font-semibold"}>Wirestate</strong>
      <span className={"text-neutral-500 dark:text-neutral-400"}>{connected ? "connected" : "reconnecting…"}</span>
      <span className={"text-neutral-500 dark:text-neutral-400"}>protocol v{protocolVersion ?? "?"}</span>
      <span className={"text-neutral-500 dark:text-neutral-400"}>
        {rootCount} root{rootCount === 1 ? "" : "s"} · {containerCount} container{containerCount === 1 ? "" : "s"}
      </span>
    </header>
  );
}
