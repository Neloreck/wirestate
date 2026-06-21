import { type DevtoolsEvent, type DevtoolsRootSnapshot } from "@wirestate/core/devtools";

import { type InspectBindingFn, type InspectFn } from "@/bridge/bridge.messages";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { type ResolvedEntity } from "@/panel/lib/selectors";

import { BindingDetail } from "./BindingDetail";
import { ContainerDetail } from "./ContainerDetail";
import { PluginDetail } from "./PluginDetail";

interface ViewProps {
  readonly resolved: ResolvedEntity;
  readonly roots: ReadonlyArray<DevtoolsRootSnapshot>;
  readonly log: ReadonlyArray<DevtoolsEvent>;
  readonly actions: PanelActions;
  readonly inspect: InspectFn;
  readonly inspectBinding: InspectBindingFn;
}

/** Routes a resolved entity to its concrete detail view (container / binding / plugin). */
export function View({ resolved, roots, log, actions, inspect, inspectBinding }: ViewProps) {
  switch (resolved.kind) {
    case "container":
      return <ContainerDetail container={resolved.container} roots={roots} log={log} actions={actions} />;
    case "binding":
      return (
        <BindingDetail
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
      return <PluginDetail plugin={resolved.plugin} />;
  }
}
