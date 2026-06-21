import { type DevtoolsEvent, type DevtoolsRootSnapshot } from "@wirestate/core/devtools";
import { type ReactNode, useEffect, useRef } from "react";

import { type InspectBindingFn, type InspectFn } from "@/bridge/bridge.messages";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { type ResolvedEntity, resolveSelection } from "@/panel/lib/selectors";
import { type Selection, isSameSelection } from "@/panel/lib/types";
import { type Optional } from "@/types/general";

import { BindingDetail } from "./BindingDetail";
import { ContainerDetail } from "./ContainerDetail";
import { LinkButton } from "./parts";
import { PluginDetail } from "./PluginDetail";

interface DetailProps {
  readonly roots: ReadonlyArray<DevtoolsRootSnapshot>;
  readonly log: ReadonlyArray<DevtoolsEvent>;
  readonly selection: Optional<Selection>;
  readonly actions: PanelActions;
  readonly inspect: InspectFn;
  readonly inspectBinding: InspectBindingFn;
}

/** Detail pane: routes the current selection to its view, with breadcrumb + dead-entity tombstone. */
export function Detail({ roots, log, selection, actions, inspect, inspectBinding }: DetailProps) {
  const cache = useRef<Optional<{ selection: Selection; resolved: ResolvedEntity }>>(undefined);
  const resolved: Optional<ResolvedEntity> = selection ? resolveSelection(roots, selection) : undefined;

  useEffect(() => {
    if (selection && resolved) {
      cache.current = { selection, resolved };
    }
  });

  let content: ReactNode;

  if (!selection) {
    content = <p className={"text-fg-muted"}>Select a container, instance, binding, or plugin in the Navigator.</p>;
  } else if (resolved) {
    content = (
      <>
        <Breadcrumb resolved={resolved} actions={actions} />
        <View resolved={resolved} roots={roots} log={log} actions={actions} inspect={inspect} inspectBinding={inspectBinding} />
      </>
    );
  } else {
    // Selection is no longer live → tombstone. Freeze the last-known view (dimmed) if it matches.
    const dead: Optional<ResolvedEntity> =
      cache.current && isSameSelection(cache.current.selection, selection) ? cache.current.resolved : undefined;

    content = (
      <div className={"space-y-3"}>
        <div
          className={
            "rounded border border-amber-400/50 bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          }
        >
          This {selection.kind} is no longer live (deprovisioned / deactivated). Showing last-known data.
          <div className={"mt-1"}>
            <LinkButton onClick={actions.clearSelection}>Clear selection</LinkButton>
          </div>
        </div>
        {dead ? (
          <div className={"pointer-events-none opacity-60"}>
            <View resolved={dead} roots={roots} log={log} actions={actions} inspect={inspect} inspectBinding={inspectBinding} />
          </div>
        ) : null}
      </div>
    );
  }

  return <section className={"flex-1 overflow-auto p-3"}>{content}</section>;
}

function Breadcrumb({ resolved, actions }: { resolved: ResolvedEntity; actions: PanelActions }) {
  const containerId: number = resolved.container.containerId;

  return (
    <div className={"mb-2 flex flex-wrap items-center gap-1 text-fg-muted"}>
      <LinkButton onClick={() => actions.select({ kind: "container", containerId })}>
        container #{containerId}
      </LinkButton>
      {resolved.kind === "container" ? null : (
        <>
          <span>▸</span>
          <span className={"text-fg"}>{entityLabel(resolved)}</span>
        </>
      )}
    </div>
  );
}

function entityLabel(resolved: ResolvedEntity): string {
  switch (resolved.kind) {
    case "binding":
      return resolved.binding.token.name;
    case "plugin":
      return resolved.plugin.name;
    default:
      return "";
  }
}

function View({
  resolved,
  roots,
  log,
  actions,
  inspect,
  inspectBinding,
}: {
  resolved: ResolvedEntity;
  roots: ReadonlyArray<DevtoolsRootSnapshot>;
  log: ReadonlyArray<DevtoolsEvent>;
  actions: PanelActions;
  inspect: InspectFn;
  inspectBinding: InspectBindingFn;
}) {
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
