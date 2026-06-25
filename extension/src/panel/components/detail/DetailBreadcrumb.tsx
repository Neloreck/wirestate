import { X } from "lucide-react";
import { useCallback } from "react";

import { LinkButton } from "@/panel/components/ui";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { type ResolvedEntity } from "@/panel/lib/selection";

interface DetailBreadcrumbProps {
  readonly resolved: ResolvedEntity;
  readonly actions: PanelActions;
}

/**
 * Trail above a detail view: the container link, plus the resolved entity when it is not the container itself.
 */
export function DetailBreadcrumb({ resolved, actions }: DetailBreadcrumbProps) {
  const containerId: number = resolved.container.containerId;

  const onContainerRefClick = useCallback(() => {
    actions.select({ kind: "container", containerId });
  }, [actions, containerId]);

  return (
    <div className={"mb-2 flex flex-wrap items-center gap-1 text-fg-muted"}>
      <LinkButton className={"font-bold uppercase"} onClick={onContainerRefClick}>
        container #{containerId}
      </LinkButton>

      {resolved.kind === "container" ? null : (
        <>
          <span>▸</span>
          <span className={"text-fg"}>{getEntityLabel(resolved)}</span>
        </>
      )}

      <button
        type={"button"}
        className={"ml-auto rounded p-0.5 hover:bg-hover hover:text-fg"}
        onClick={actions.clearSelection}
        title={"Close (clear selection)"}
        aria-label={"Close"}
      >
        <X className={"size-4"} />
      </button>
    </div>
  );
}

function getEntityLabel(resolved: ResolvedEntity): string {
  switch (resolved.kind) {
    case "binding":
      return resolved.binding.token.name;
    case "plugin":
      return resolved.plugin.name;
    default:
      return "";
  }
}
