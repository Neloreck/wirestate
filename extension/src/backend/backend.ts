import { type DevtoolsHook, installDevtoolsHook } from "#/devtools";

import { InspectorBackend } from "@/backend/backend.inspector";
import { postToContent } from "@/backend/backend.messaging";

/**
 * MAIN-world content-script entry and composition root.
 * Installs (or reuses) the page's DevTools hook, constructs the inspector backend,
 * and wires its two external event sources to the backend's handlers.
 */
const hook: DevtoolsHook = installDevtoolsHook();
const backend: InspectorBackend = new InspectorBackend(hook, postToContent);

hook.subscribe((event) => backend.onDelta(event));

window.addEventListener("message", (event) => backend.onMessage(event));
