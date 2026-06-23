import { type InspectNode } from "@/bridge/bridge.messages";
import { type Optional } from "@/types/general";

import { DetailStateNode } from "./DetailStateNode";

/**
 * Navigates when the user clicks a field that points at a tracked service. Carries the instance id
 * (the precise key) plus its class name (for labelling); the handler resolves the realizing binding.
 */
export type ServiceNavigator = (containerId: number, instanceId: number, className: string) => void;

/**
 * Reads one level of a value at a path. The caller binds it to a specific inspection root — a service
 * instance (`inspect`) or a `Value` binding (`inspectBinding`) — so the tree itself stays agnostic.
 * Must be referentially stable (memoized) per root, or every node refetches on each parent render.
 */
export type ValueReader = (path: ReadonlyArray<string | number>) => Promise<InspectNode>;

interface DetailStateTreeProps {
  readonly read: Optional<ValueReader>;
  readonly rootLabel: string;
  readonly onNavigate?: ServiceNavigator;
}

/**
 * On-demand view of a live value: each node fetches one level via `read`, lazily.
 */
export function DetailStateTree({ read, rootLabel, onNavigate }: DetailStateTreeProps) {
  if (!read) {
    return <span className={"text-fg-muted"}>inspection unavailable here</span>;
  }

  return <DetailStateNode read={read} path={[]} label={rootLabel} depth={0} defaultOpen onNavigate={onNavigate} />;
}
