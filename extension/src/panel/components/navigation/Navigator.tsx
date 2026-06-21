import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { type RootModel } from "@/panel/lib/selectors";
import { type Selection } from "@/panel/lib/types";
import { type Optional } from "@/types/general";

import { ContainerNode } from "./ContainerNode";

interface NavigatorProps {
  readonly roots: ReadonlyArray<RootModel>;
  readonly selection: Optional<Selection>;
  readonly collapsed: ReadonlySet<number>;
  readonly actions: PanelActions;
}

/** Master region: roots → nested container hierarchy. Selecting a container drives the Detail pane. */
export function Navigator({ roots, selection, collapsed, actions }: NavigatorProps) {
  if (roots.length === 0) {
    return (
      <nav className={"h-full w-full overflow-auto p-2"}>
        <p className={"text-fg-muted"}>
          No Wirestate roots detected on this page. Is a <code>DevToolsPlugin</code> registered and a provider mounted?
        </p>
      </nav>
    );
  }

  return (
    <nav className={"h-full w-full overflow-auto p-1"}>
      {roots.map((root) => (
        <div key={root.rootId} className={"mb-1"}>
          <div className={"px-1 py-0.5 font-semibold text-[#ff4733]"}>{root.label}</div>
          {root.nodes.map((node) => (
            <ContainerNode
              key={node.container.containerId}
              node={node}
              depth={0}
              selection={selection}
              collapsed={collapsed}
              actions={actions}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
