/**
 * Framework-agnostic Wirestate APIs for containers, services, lifecycle, messaging, and dependency injection.
 *
 * @packageDocumentation
 */

// Installs the `Symbol.metadata` polyfill before any consumer class definition:
// importing anything from this package guarantees standard decorators can attach metadata.
// Kept as the first statement on purpose.
import "./metadata/metadata-symbol-polyfill";

export { type ProvisionId } from "./activation/wire-status";
export { WireStatus } from "./activation/wire-status";
export { OnActivation } from "./activation/on-activation";
export { OnDeactivation } from "./activation/on-deactivation";

export {
  type Binding,
  type BindingDescriptor,
  type BindingScopeValue,
  type BindingTypeValue,
  type FactoryBindingDescriptor,
  type ServiceToken,
  type InstanceBindingDescriptor,
  type ValueBindingDescriptor,
} from "./binding/binding";
export { BindingScope, BindingType } from "./binding/binding";
export { InjectionToken } from "./binding/binding-tokens";

export { type ContainerConfig } from "./container/container";
export { Container } from "./container/container";
export { inject } from "./container/container-context";
export { validateContainerConfig } from "./container/container-config-validation";

export {
  type InternalErrorDescriptor,
  type InternalErrorHandler,
  type InternalErrorSource,
} from "./error/internal-error-handler";
export { defaultInternalErrorHandler } from "./error/internal-error-handler";
export { WirestateError } from "./error/wirestate-error";

export { Injectable, isInjectable } from "./metadata/metadata-injectable";
export { type LifecycleDecorator } from "./metadata/metadata-single-method-decorator";

export { CommandBus } from "./plugin/commands/command-bus";
export { CommandsPlugin } from "./plugin/commands/commands-plugin";
export {
  type CommandDispatchOptions,
  type CommandHandler,
  type CommandType,
  type CommandUnregister,
} from "./plugin/commands/commands";
export { type OnCommandDecorator } from "./plugin/commands/on-command";
export { OnCommand } from "./plugin/commands/on-command";
export { type OnEventDecorator } from "./plugin/events/on-event";
export { OnEvent } from "./plugin/events/on-event";
export { EventBus } from "./plugin/events/event-bus";
export { EventsPlugin } from "./plugin/events/events-plugin";
export {
  type EventEmitOptions,
  type EventHandler,
  type EventType,
  type EventUnsubscribe,
  type WireEvent,
} from "./plugin/events/events";
export {
  type QueryDispatchOptions,
  type QueryHandler,
  type QueryType,
  type QueryUnregister,
} from "./plugin/queries/queries";
export { QueryBus } from "./plugin/queries/query-bus";
export { QueriesPlugin } from "./plugin/queries/queries-plugin";
export { type OnQueryDecorator } from "./plugin/queries/on-query";
export { OnQuery } from "./plugin/queries/on-query";
export { type WirestatePlugin } from "./plugin/plugin";

export { OnDeprovision } from "./provision/on-deprovision";
export { OnProvision } from "./provision/on-provision";

export { type Newable } from "./types/general";
