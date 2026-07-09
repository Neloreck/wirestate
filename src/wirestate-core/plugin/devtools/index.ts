/**
 * Internal full DevTools protocol surface for first-party tooling (the inspector extension and the
 * end-to-end tests). NOT a published entrypoint.
 *
 * @remarks
 * The public package exposes only Plugin through `@wirestate/core/devtools`.
 *
 * @internal
 * @packageDocumentation
 */

export { DevToolsPlugin, type DevToolsPluginOptions } from "./devtools-plugin";
export { DEVTOOLS_HOOK_KEY, DEVTOOLS_PROTOCOL_VERSION, getDevtoolsHook, installDevtoolsHook } from "./devtools-hook";

export {
  type DevtoolsBinding,
  type DevtoolsBindingId,
  type DevtoolsContainerId,
  type DevtoolsContainerSnapshot,
  type DevtoolsEvent,
  type DevtoolsHandler,
  type DevtoolsHook,
  type DevtoolsInspectPath,
  type DevtoolsInstance,
  type DevtoolsInstanceId,
  type DevtoolsInstanceStatus,
  type DevtoolsLifecycleEvent,
  type DevtoolsLifecycleHook,
  type DevtoolsLifecycleHookMethod,
  type DevtoolsLifecyclePhase,
  type DevtoolsListener,
  type DevtoolsMessage,
  type DevtoolsMessageChannel,
  type DevtoolsMessageEvent,
  type DevtoolsMessageResult,
  type DevtoolsMessageResultEvent,
  type DevtoolsMethod,
  type DevtoolsPluginInfo,
  type DevtoolsRegistration,
  type DevtoolsRegistrationEvent,
  type DevtoolsRegistrationPhase,
  type DevtoolsRoot,
  type DevtoolsRootId,
  type DevtoolsRootRegister,
  type DevtoolsRootSnapshot,
  type DevtoolsServiceRef,
  type DevtoolsToken,
} from "./devtools-hook.types";
