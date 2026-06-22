import { useEffect, useRef, useState } from "react";

import { type InspectNode } from "@/bridge/bridge.messages";
import { type Optional } from "@/types/general";

import { type NavigateToService, type ValueReader } from "./StateTree";

/** A field whose value is itself a container-managed instance. */
type ServiceNode = Extract<InspectNode, { kind: "service" }>;

interface StateNodeProps {
  readonly read: ValueReader;
  readonly path: ReadonlyArray<string | number>;
  readonly label: string;
  readonly depth: number;
  readonly defaultOpen?: boolean;
  readonly onNavigate?: NavigateToService;
}

/** One level of a live value: fetches its node via `read`, lazily expanding children on demand. */
export function StateNode({ read, path, label, depth, defaultOpen = false, onNavigate }: StateNodeProps) {
  // `path` is a fresh array each render; key the fetch effect on its stable string form.
  const pathKey: string = path.join(" ");
  const pathRef = useRef(path);

  pathRef.current = path;

  const [node, setNode] = useState<Optional<InspectNode>>(undefined);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    let cancelled = false;
    const currentPath = pathRef.current;

    void read(currentPath).then((result) => {
      if (!cancelled) {
        setNode(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [read, pathKey]);

  const expandable: boolean = node?.kind === "object" || node?.kind === "array";
  const service: Optional<ServiceNode> = node?.kind === "service" ? node : undefined;
  const navigable: boolean = service !== undefined && onNavigate !== undefined;
  const clickable: boolean = expandable || navigable;

  function handleClick(): void {
    if (expandable) {
      setOpen((value) => !value);
    } else if (service && onNavigate) {
      onNavigate(service.containerId, service.instanceId, service.className);
    }
  }

  return (
    <div style={{ paddingLeft: `${depth * 12}px` }}>
      <span className={clickable ? "cursor-pointer" : undefined} onClick={clickable ? handleClick : undefined}>
        <span className={"text-fg-subtle"}>{expandable ? (open ? "▾ " : "▸ ") : "  "}</span>
        <span className={"text-fg-muted"}>{label}</span>
        {": "}
        {service ? (
          <span
            className={navigable ? "text-sky-600 hover:underline dark:text-sky-400" : "text-sky-600 dark:text-sky-400"}
            title={navigable ? `Jump to ${service.className}` : undefined}
          >
            ↪ {service.className} <span className={"text-fg-subtle"}>(service)</span>
          </span>
        ) : (
          <span>{node ? summarize(node) : "…"}</span>
        )}
      </span>

      {open && node ? (
        <div>
          {childKeys(node).map((key) => (
            <StateNode
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

function childKeys(node: InspectNode): ReadonlyArray<string | number> {
  if (node.kind === "object") {
    return node.keys;
  }

  if (node.kind === "array") {
    return Array.from({ length: node.length }, (_unused, index) => index);
  }

  return [];
}

function summarize(node: InspectNode): string {
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
}
