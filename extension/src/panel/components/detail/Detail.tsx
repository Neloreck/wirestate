import { useInjection } from "@wirestate/react";
import { observer } from "@wirestate/react-mobx";
import { useEffect, useRef } from "react";

import { LinkButton } from "@/panel/components/ui";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { type ResolvedEntity, type Selection, isSameSelection, resolveSelection } from "@/panel/lib/selection";
import { BridgeService } from "@/panel/services/bridge.service";
import { type Optional } from "@/types/general";

import { DetailBreadcrumb } from "./DetailBreadcrumb";
import { DetailResolvedView } from "./DetailResolvedView";

interface DetailProps {
  readonly selection: Optional<Selection>;
  readonly actions: PanelActions;
}

/**
 * Detail panel: routes the current selection to its view, with breadcrumb + dead-entity tombstone.
 */
export const Detail = observer(function Detail({ selection, actions }: DetailProps) {
  const bridgeService: BridgeService = useInjection(BridgeService);

  const cache = useRef<Optional<{ selection: Selection; resolved: ResolvedEntity }>>(undefined);
  const resolved: Optional<ResolvedEntity> = selection ? resolveSelection(bridgeService.roots, selection) : undefined;

  useEffect(() => {
    if (selection && resolved) {
      cache.current = { selection, resolved };
    }
  });

  if (!selection) {
    return <p className={"text-fg-muted"}>Select a container, instance, binding, or plugin in the Navigator.</p>;
  } else if (resolved) {
    return (
      <>
        <DetailBreadcrumb resolved={resolved} actions={actions} />

        <DetailResolvedView
          resolved={resolved}
          roots={bridgeService.roots}
          log={bridgeService.log}
          actions={actions}
          inspect={bridgeService.inspect}
          inspectBinding={bridgeService.inspectBinding}
        />
      </>
    );
  } else {
    // Selection is no longer live -> tombstone. Freeze the last-known view (dimmed) if it matches.
    const deadEntry: Optional<ResolvedEntity> =
      cache.current && isSameSelection(cache.current.selection, selection) ? cache.current.resolved : undefined;

    return (
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

        {deadEntry ? (
          <div className={"pointer-events-none opacity-60"}>
            <DetailResolvedView
              resolved={deadEntry}
              roots={bridgeService.roots}
              log={bridgeService.log}
              actions={actions}
              inspect={bridgeService.inspect}
              inspectBinding={bridgeService.inspectBinding}
            />
          </div>
        ) : null}
      </div>
    );
  }
});
