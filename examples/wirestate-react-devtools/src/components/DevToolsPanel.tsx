import "./DevToolsPanel.css";

import {
  type DevtoolsEvent,
  type DevtoolsHook,
  type DevtoolsRootSnapshot,
  getDevtoolsHook,
} from "@wirestate/core/devtools";
import { useEffect, useState } from "react";

const MAX_LOG: number = 100;

/**
 * Minimal inspector panel: a consumer that talks only to the v1 devtools hook
 * (`getRoots()` + `subscribe()`) and renders the container tree plus a live stream of
 * lifecycle, message, and registration deltas. This is the Phase-B validation vehicle —
 * it exercises the protocol exactly as an out-of-page backend would.
 */
export function DevToolsPanel() {
  const [roots, setRoots] = useState<ReadonlyArray<DevtoolsRootSnapshot>>([]);
  const [log, setLog] = useState<ReadonlyArray<DevtoolsEvent>>([]);

  useEffect(() => {
    const hook: DevtoolsHook | undefined = getDevtoolsHook();

    if (!hook) {
      return;
    }

    const refresh = (): void => setRoots(hook.getRoots().map((root) => root.snapshot()));

    refresh();

    return hook.subscribe((event: DevtoolsEvent): void => {
      setLog((previous) => [...previous, event].slice(-MAX_LOG));
      refresh();
    });
  }, []);

  if (roots.length === 0) {
    return <div className={"devtools__empty"}>No devtools hook found — is the DevToolsPlugin installed?</div>;
  }

  return (
    <div className={"devtools"}>
      <div className={"devtools__tree"}>
        {roots.flatMap((root) =>
          root.containers.map((container) => (
            <div key={`${root.rootId}:${container.containerId}`} className={"devtools__container"}>
              <div className={"devtools__container-head"}>
                container #{container.containerId}
                {container.parentContainerId === null ? " (root)" : ` ◂ #${container.parentContainerId}`}
              </div>

              <div className={"devtools__row"}>
                <span className={"devtools__label"}>plugins</span>
                <span>{container.plugins.map((plugin) => plugin.name).join(", ") || "—"}</span>
              </div>

              <div className={"devtools__row"}>
                <span className={"devtools__label"}>bindings</span>
                <span>
                  {container.bindings.map((binding) => `${binding.token.name} (${binding.type})`).join(", ") || "—"}
                </span>
              </div>

              <ul className={"devtools__instances"}>
                {container.instances.map((instance) => (
                  <li key={instance.className} className={"devtools__instance"}>
                    <span className={"devtools__instance-name"}>{instance.className}</span>
                    {instance.handlers.length > 0 ? (
                      <span className={"devtools__handlers"}>
                        {instance.handlers.map((handler) => `${handler.channel}:${handler.type}`).join(", ")}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )),
        )}
      </div>

      <div className={"devtools__log"}>
        {log.length === 0 ? (
          <div className={"devtools__empty"}>No activity yet — interact with the app above.</div>
        ) : (
          log.map((event, index) => (
            <div key={index} className={`devtools__event devtools__event--${event.kind}`}>
              {formatEvent(event)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Renders one stream delta as a single line.
 *
 * @param event - The delta to format.
 * @returns A display string.
 */
function formatEvent(event: DevtoolsEvent): string {
  switch (event.kind) {
    case "lifecycle":
      return `#${event.rootId} · lifecycle · ${event.phase}${event.instance ? ` · ${event.instance.className}` : ""}`;

    case "message":
      return `#${event.rootId} · ${event.message.channel} · ${event.message.type}`;

    case "registration":
      return `#${event.rootId} · ${event.registration.phase} · ${event.registration.channel} · ${event.registration.type}`;

    default:
      return `#${event["rootId"]} · unknown`;
  }
}
