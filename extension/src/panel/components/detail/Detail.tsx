import { type DevtoolsEvent, type DevtoolsRootSnapshot } from "@wirestate/core/devtools";
import { type ReactNode, useEffect, useRef } from "react";

import { type InspectBindingFn, type InspectFn } from "@/bridge/bridge.messages";
import { LinkButton } from "@/panel/components/ui";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { type ResolvedEntity, resolveSelection } from "@/panel/lib/selectors";
import { type Selection, isSameSelection } from "@/panel/lib/types";
import { type Optional } from "@/types/general";

import { Breadcrumb } from "./Breadcrumb";
import { View } from "./View";

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
        <View
          resolved={resolved}
          roots={roots}
          log={log}
          actions={actions}
          inspect={inspect}
          inspectBinding={inspectBinding}
        />
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
            <View
              resolved={dead}
              roots={roots}
              log={log}
              actions={actions}
              inspect={inspect}
              inspectBinding={inspectBinding}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return <section className={"flex-1 overflow-auto p-3"}>{content}</section>;
}
