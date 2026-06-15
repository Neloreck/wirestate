/**
 * DevTools integration entrypoint for Wirestate: the {@link DevToolsPlugin} and the
 * hook/protocol an inspector backend (a Chrome extension or a standalone dev panel)
 * reads.
 *
 * @remarks
 * Kept out of the everyday `@wirestate/core` barrel on purpose — installing
 * {@link DevToolsPlugin} is a development-time integration, and the protocol below is
 * provisional and version-stamped. Import these from `@wirestate/core/devtools`.
 *
 * @packageDocumentation
 */

export { DevToolsPlugin } from "./plugin/devtools/devtools-plugin";
export {
  DEVTOOLS_HOOK_KEY,
  DEVTOOLS_PROTOCOL_VERSION,
  getDevtoolsHook,
  installDevtoolsHook,
} from "./plugin/devtools/devtools-hook";
export type {
  DevtoolsBinding,
  DevtoolsContainerId,
  DevtoolsContainerSnapshot,
  DevtoolsEvent,
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
  DevtoolsRoot,
  DevtoolsRootId,
  DevtoolsRootRegister,
  DevtoolsRootSnapshot,
  DevtoolsToken,
} from "./plugin/devtools/devtools-hook";
