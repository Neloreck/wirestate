import type { ContainerNodeModel, RootModel } from "@/panel/selectors";
import type { Selection } from "@/panel/types";
import type { PanelActions } from "@/panel/use-panel-state";
import type { Optional } from "@/types/general";

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
      <nav className={"w-[42%] min-w-[220px] overflow-auto border-r border-neutral-200 p-2 dark:border-neutral-700"}>
        <p className={"text-neutral-500 dark:text-neutral-400"}>
          No Wirestate roots detected on this page. Is a <code>DevToolsPlugin</code> registered and a provider mounted?
        </p>
      </nav>
    );
  }

  return (
    <nav className={"w-[42%] min-w-[220px] overflow-auto border-r border-neutral-200 p-1 dark:border-neutral-700"}>
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

interface ContainerNodeProps {
  readonly node: ContainerNodeModel;
  readonly depth: number;
  readonly selection: Optional<Selection>;
  readonly collapsed: ReadonlySet<number>;
  readonly actions: PanelActions;
}

function ContainerNode({ node, depth, selection, collapsed, actions }: ContainerNodeProps) {
  const containerId: number = node.container.containerId;
  const isSelected: boolean = selection?.kind === "container" && selection.containerId === containerId;
  const isCollapsed: boolean = collapsed.has(containerId);
  const hasChildren: boolean = node.children.length > 0;

  return (
    <div>
      <div
        className={`flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
          isSelected ? "bg-neutral-200 dark:bg-neutral-700" : ""
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={() => actions.select({ kind: "container", containerId })}
      >
        {hasChildren ? (
          <button
            type={"button"}
            className={"w-3 text-neutral-500"}
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
        <span className={"text-neutral-400 dark:text-neutral-500"}>
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
