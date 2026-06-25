import { useInjection } from "@wirestate/react";
import { observer } from "@wirestate/react-mobx";
import { RefreshCw } from "lucide-react";

import { BridgeService } from "@/panel/services/bridge.service";

/**
 * Thin top bar: connection status, protocol version, a root/container summary, and a manual refresh.
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
      <span className={"flex-1"} />
      <button
        className={
          "inline-flex cursor-pointer items-center gap-1 rounded border border-divider px-1 py-1 hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
        }
        disabled={!bridgeService.isConnected}
        title={"Re-fetch the latest state from the page"}
        type={"button"}
        onClick={bridgeService.refresh}
      >
        <RefreshCw className={"size-3"} />
      </button>
    </header>
  );
});
