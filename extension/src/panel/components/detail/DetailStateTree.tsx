import { type InspectNode } from "@/bridge/bridge.messages";
import { type Optional } from "@/types/general";

import { DetailStateNode } from "./DetailStateNode";

interface DetailStateTreeProps {
  readonly read: Optional<(path: ReadonlyArray<string | number>) => Promise<InspectNode>>;
  readonly rootLabel: string;
  readonly onNavigate?: (containerId: number, instanceId: number, className: string) => void;
}

/**
 * On-demand view of a live value: each node fetches one level via `read`, lazily.
 */
export function DetailStateTree({ read, rootLabel, onNavigate }: DetailStateTreeProps) {
  return read ? (
    <DetailStateNode read={read} path={[]} label={rootLabel} depth={0} defaultOpen onNavigate={onNavigate} />
  ) : (
    <span className={"text-fg-muted"}>inspection unavailable here</span>
  );
}
