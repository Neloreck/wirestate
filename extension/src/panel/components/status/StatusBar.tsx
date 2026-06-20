import { type Optional } from "@/types/general";

interface StatusBarProps {
  readonly isConnected: boolean;
  readonly protocolVersion: Optional<number>;
  readonly rootsCount: number;
  readonly containersCount: number;
}

/**
 * Thin top bar: connection status, protocol version, and summary.
 */
export function StatusBar({ isConnected, protocolVersion, rootsCount, containersCount }: StatusBarProps) {
  return (
    <header className={"flex items-center gap-2.5 border-b border-divider bg-elevated px-2 py-1"}>
      <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-red-500"}`} />
      <strong className={"font-semibold"}>Wirestate</strong>
      <span className={"text-fg-muted"}>{isConnected ? "connected" : "reconnecting…"}</span>
      <span className={"text-fg-muted"}>protocol v{protocolVersion ?? "?"}</span>
      <span className={"text-fg-muted"}>
        {rootsCount} root{rootsCount === 1 ? "" : "s"} · {containersCount} container{containersCount === 1 ? "" : "s"}
      </span>
    </header>
  );
}
