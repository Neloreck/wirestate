import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { type ContainerNodeModel } from "@/panel/lib/selectors";
import { type Selection } from "@/panel/lib/types";
import { type Optional } from "@/types/general";

interface ContainerNodeProps {
  readonly node: ContainerNodeModel;
  readonly depth: number;
  readonly selection: Optional<Selection>;
  readonly collapsed: ReadonlySet<number>;
  readonly actions: PanelActions;
}

/** One container row in the Navigator, recursively rendering its child containers. */
export function ContainerNode({ node, depth, selection, collapsed, actions }: ContainerNodeProps) {
  const containerId: number = node.container.containerId;
  const isSelected: boolean = selection?.kind === "container" && selection.containerId === containerId;
  const isCollapsed: boolean = collapsed.has(containerId);
  const hasChildren: boolean = node.children.length > 0;

  return (
    <div>
      <div
        className={`flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 hover:bg-hover ${
          isSelected ? "bg-selected" : ""
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={() => actions.select({ kind: "container", containerId })}
      >
        {hasChildren ? (
          <button
            type={"button"}
            className={"w-3 text-fg-muted"}
            onClick={(event) => {
              event.stopPropagation();
              actions.toggleCollapsed(containerId);
            }}
          >
            {isCollapsed ? "▸" : "▾"}
          </button>
        ) : (
          <span className={"w-3"} />
        )}
        <span>container #{containerId}</span>
        <span className={"text-fg-subtle"}>
          · {node.container.instances.length} inst · {node.container.bindings.length} bind
        </span>
      </div>

      {hasChildren && !isCollapsed
        ? node.children.map((child) => (
            <ContainerNode
              key={child.container.containerId}
              node={child}
              depth={depth + 1}
              selection={selection}
              collapsed={collapsed}
              actions={actions}
            />
          ))
        : null}
    </div>
  );
}
