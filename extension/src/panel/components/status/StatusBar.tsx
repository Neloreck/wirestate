import { useInjection } from "@wirestate/react";
import { observer } from "@wirestate/react-mobx";

import { BridgeService } from "@/panel/services/bridge.service";

/**
 * Thin top bar: connection status, protocol version, and a root/container summary. Reads the bridge
 * state directly (observer), so a streamed delta re-renders only this bar — not the whole panel.
 */
export const StatusBar = observer(function StatusBar() {
  const bridgeService: BridgeService = useInjection(BridgeService);

  const rootsCount: number = bridgeService.roots.length;
  const containersCount: number = bridgeService.roots.reduce((total, root) => total + root.containers.length, 0);

  return (
    <header className={"flex items-center gap-2.5 border-b border-divider bg-elevated px-2 py-1"}>
      <span className={`h-2 w-2 rounded-full ${bridgeService.isConnected ? "bg-emerald-500" : "bg-red-500"}`} />
      <span className={"text-fg-muted"}>{bridgeService.isConnected ? "connected" : "reconnecting…"}</span>·
      <span className={"text-fg-muted"}>
        {rootsCount} root{rootsCount === 1 ? "" : "s"} · {containersCount} container{containersCount === 1 ? "" : "s"}
      </span>
    </header>
  );
});
