import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type InspectNode } from "@/bridge/bridge.messages";
import { getInspectNodeColorClass } from "@/panel/lib/styling/value-type";
import { type Optional } from "@/types/general";

function getNodeChildKeys(node: InspectNode): ReadonlyArray<string | number> {
  if (node.kind === "object") {
    return node.keys;
  }

  if (node.kind === "array") {
    return Array.from({ length: node.length }, (_unused, index) => index);
  }

  return [];
}

interface DetailStateNodeProps {
  readonly read: (path: ReadonlyArray<string | number>) => Promise<InspectNode>;
  readonly path: ReadonlyArray<string | number>;
  readonly label: string;
  readonly depth: number;
  readonly defaultOpen?: boolean;
  readonly onNavigate?: (containerId: number, instanceId: number, className: string) => void;
}

/**
 * One level of a live value: fetches its node via `read`, lazily expanding children on demand.
 */
export function DetailStateNode({ read, path, label, depth, defaultOpen = false, onNavigate }: DetailStateNodeProps) {
  // `path` is a fresh array each render; key the fetch effect on its stable string form.
  const pathKey: string = path.join(" ");
  const pathRef = useRef(path);

  pathRef.current = path;

  const [node, setNode] = useState<Optional<InspectNode>>(undefined);
  const [open, setOpen] = useState(defaultOpen);

  const serviceNode = node?.kind === "service" ? node : undefined;
  const isExpandable: boolean = node?.kind === "object" || node?.kind === "array";
  const isNavigable: boolean = serviceNode !== undefined && onNavigate !== undefined;
  const isClickable: boolean = isExpandable || isNavigable;

  const summary: string = useMemo(() => {
    if (!node) {
      return "…";
    }

    switch (node.kind) {
      case "primitive":
        return typeof node.value === "string" ? JSON.stringify(node.value) : String(node.value);
      case "leaf":
      case "object":
      case "array":
      case "service":
        return node.preview;
      case "unsupported":
        return "(inspection not supported by this page's wirestate build)";
    }
  }, [node]);

  const onDetailClick = useCallback(() => {
    if (isExpandable) {
      setOpen((it) => !it);
    } else if (serviceNode && onNavigate) {
      onNavigate(serviceNode.containerId, serviceNode.instanceId, serviceNode.className);
    }
  }, [isExpandable, onNavigate, serviceNode]);

  useEffect(() => {
    let cancelled: boolean = false;

    const currentPath = pathRef.current;

    read(currentPath).then((result) => {
      if (!cancelled) {
        setNode(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [read, pathKey]);

  return (
    <div className={depth ? "pl-3" : ""}>
      <span className={isClickable ? "cursor-pointer" : undefined} onClick={isClickable ? onDetailClick : undefined}>
        <span className={"text-fg-subtle"}>{isExpandable ? (open ? "▾ " : "▸ ") : "  "}</span>
        <span className={"text-fg-muted"}>{label}</span>
        {": "}
        {serviceNode ? (
          <span
            className={
              isNavigable ? "text-sky-600 hover:underline dark:text-sky-400" : "text-sky-600 dark:text-sky-400"
            }
            title={isNavigable ? `Jump to ${serviceNode.className}` : undefined}
          >
            ↪ {serviceNode.className} <span className={"text-fg-subtle"}>(service)</span>
          </span>
        ) : (
          <span className={node ? getInspectNodeColorClass(node) : undefined}>{summary}</span>
        )}
      </span>

      {open && node ? (
        <div>
          {getNodeChildKeys(node).map((key) => (
            <DetailStateNode
              key={String(key)}
              read={read}
              path={[...path, key]}
              label={String(key)}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
