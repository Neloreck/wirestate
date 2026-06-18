import { type DevtoolsEvent, type DevtoolsHook } from "@wirestate/core/devtools";

import { ensureHook } from "@/backend/backend.hook";

export const BACKEND_HOOK: DevtoolsHook = ensureHook();

export const BACKEND_BUFFER: Array<DevtoolsEvent> = [];
