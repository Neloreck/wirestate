/**
 * DevTools integration entrypoint for Wirestate: the {@link DevToolsPlugin} and the
 * hook/protocol an inspector backend (a Chrome extension or a standalone dev panel)
 * reads.
 *
 * @packageDocumentation
 */

export { DevToolsPlugin, DevToolsPluginConfig } from "./plugin/devtools/devtools-plugin";

export {
  DEVTOOLS_HOOK_KEY,
  DEVTOOLS_PROTOCOL_VERSION,
  DevtoolsBinding,
  DevtoolsContainerId,
  DevtoolsContainerSnapshot,
  DevtoolsEvent,
  DevtoolsHandler,
  DevtoolsHook,
  DevtoolsInstance,
  DevtoolsInstanceStatus,
  DevtoolsLifecycleEvent,
  DevtoolsLifecyclePhase,
  DevtoolsListener,
  DevtoolsMessage,
  DevtoolsMessageChannel,
  DevtoolsMessageEvent,
  DevtoolsPluginInfo,
  DevtoolsRegistration,
  DevtoolsRegistrationEvent,
  DevtoolsRegistrationPhase,
  DevtoolsRoot,
  DevtoolsRootId,
  DevtoolsRootRegister,
  DevtoolsRootSnapshot,
  DevtoolsToken,
  getDevtoolsHook,
  installDevtoolsHook,
} from "./plugin/devtools/devtools-hook";
