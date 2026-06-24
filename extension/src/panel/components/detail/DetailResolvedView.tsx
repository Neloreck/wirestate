import { type DevtoolsEvent, type DevtoolsRootSnapshot } from "@wirestate/core/devtools";

import { type InspectBindingFn, type InspectFn } from "@/bridge/bridge.messages";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { type ResolvedEntity } from "@/panel/lib/selection";

import { DetailBinding } from "./DetailBinding";
import { DetailContainer } from "./DetailContainer";
import { DetailPlugin } from "./DetailPlugin";

interface DetailResolvedViewProps {
  readonly resolved: ResolvedEntity;
  readonly roots: ReadonlyArray<DevtoolsRootSnapshot>;
  readonly log: ReadonlyArray<DevtoolsEvent>;
  readonly actions: PanelActions;
  readonly inspect: InspectFn;
  readonly inspectBinding: InspectBindingFn;
}

/**
 * Routes a resolved entity to its concrete detail view (container / binding / plugin).
 */
export function DetailResolvedView({
  resolved,
  roots,
  log,
  actions,
  inspect,
  inspectBinding,
}: DetailResolvedViewProps) {
  switch (resolved.kind) {
    case "container":
      return <DetailContainer container={resolved.container} roots={roots} log={log} actions={actions} />;

    case "binding":
      return (
        <DetailBinding
          container={resolved.container}
          binding={resolved.binding}
          actions={actions}
          roots={roots}
          log={log}
          inspect={inspect}
          inspectBinding={inspectBinding}
        />
      );

    case "plugin":
      return <DetailPlugin plugin={resolved.plugin} />;
  }
}
