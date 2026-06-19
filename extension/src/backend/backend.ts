import { DEVTOOLS_PROTOCOL_VERSION, type DevtoolsEvent } from "@wirestate/core/devtools";

import { post } from "@/backend/backend.messaging";
import { BACKEND_BUFFER, BACKEND_HOOK } from "@/backend/backend.state";
import { getRootsSnapshot, inspectAt, record } from "@/backend/backend.utils";
import { BRIDGE_SOURCE, type PageMessage, type PanelToBackend } from "@/bridge/bridge.messages";
import { type Optional } from "@/types/general";

/**
 * Forwards every delta the hook emits to the panel, recording it in the replay buffer first.
 */
BACKEND_HOOK.subscribe((event: DevtoolsEvent): void => post({ type: "event", event: record(event) }));

/**
 * Answers panel requests arriving over the bridge: `attach` (init payload), `refresh` (re-snapshot),
 * and `inspect` (one-level read).
 */
window.addEventListener("message", (messageEvent: MessageEvent): void => {
  const data: Optional<PageMessage> = messageEvent.data as Optional<PageMessage>;

  if (!data || data.source !== BRIDGE_SOURCE || data.dir !== "to-page") {
    return;
  }

  const request: PanelToBackend = data.payload;

  if (request.type === "attach") {
    post({
      type: "init",
      protocolVersion: BACKEND_HOOK.protocolVersion ?? DEVTOOLS_PROTOCOL_VERSION,
      roots: getRootsSnapshot(),
      events: [...BACKEND_BUFFER],
    });
  } else if (request.type === "refresh") {
    post({ type: "snapshot", roots: getRootsSnapshot() });
  } else if (request.type === "inspect") {
    post({
      type: "inspectResult",
      requestId: request.requestId,
      node: inspectAt(request.rootId, request.instanceId, request.path),
    });
  }
});
