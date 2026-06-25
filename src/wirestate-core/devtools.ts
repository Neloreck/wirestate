/**
 * DevTools integration entrypoint for Wirestate: the {@link DevToolsPlugin} and the
 * hook/protocol an inspector backend (a Chrome extension or a standalone dev panel)
 * reads.
 *
 * @packageDocumentation
 */

export { DevToolsPlugin, type DevToolsPluginConfig } from "./plugin/devtools/devtools-plugin";
export {
  DEVTOOLS_HOOK_KEY,
  DEVTOOLS_PROTOCOL_VERSION,
  getDevtoolsHook,
  installDevtoolsHook,
} from "./plugin/devtools/devtools-hook";

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
} from "./plugin/devtools/devtools-hook.types";
