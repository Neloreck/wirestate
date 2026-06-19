import { type DevtoolsEvent, type DevtoolsHook, installDevtoolsHook } from "@wirestate/core/devtools";

export const BACKEND_HOOK: DevtoolsHook = installDevtoolsHook();

export const BACKEND_BUFFER: Array<DevtoolsEvent> = [];
