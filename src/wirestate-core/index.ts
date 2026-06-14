/**
 * Framework-agnostic Wirestate APIs for containers, services, lifecycle, messaging, and dependency injection.
 *
 * @packageDocumentation
 */

// Installs the `Symbol.metadata` polyfill before any consumer class definition:
// importing anything from this package guarantees standard decorators can attach metadata.
// Kept as the first statement on purpose.
import "./metadata/metadata-symbol-polyfill";

export { ProvisionId, WireStatus } from "./activation/wire-status";
export { OnActivated } from "./activation/on-activated";
export { OnDeactivation } from "./activation/on-deactivation";

export {
  Binding,
  BindingDescriptor,
  BindingScope,
  BindingType,
  Bindings,
  FactoryBindingDescriptor,
  ServiceToken,
  InstanceBindingDescriptor,
  ValueBindingDescriptor,
} from "./binding/binding";
export { InjectionToken } from "./binding/binding-tokens";

export { Container, ContainerConfig } from "./container/container";
export { inject } from "./container/container-context";
export { validateContainerConfig } from "./container/container-config-validation";

export {
  defaultInternalErrorHandler,
  InternalErrorDescriptor,
  InternalErrorHandler,
  InternalErrorSource,
} from "./error/internal-error-handler";
export { WirestateError } from "./error/wirestate-error";

export { Injectable, isInjectable } from "./metadata/metadata-injectable";

export { CommandBus } from "./plugin/commands/command-bus";
export { CommandsPlugin } from "./plugin/commands/commands-plugin";
export { CommandHandler, CommandType, CommandUnregister } from "./plugin/commands/commands";
export { OnCommand, OnCommandHandlerDecorator } from "./plugin/commands/on-command";
export { OnEvent, OnEventHandlerDecorator } from "./plugin/events/on-event";
export { EventBus } from "./plugin/events/event-bus";
export { EventsPlugin } from "./plugin/events/events-plugin";
export { EventEmitOptions, EventHandler, EventType, EventUnsubscribe, WireEvent } from "./plugin/events/events";
export { QueryHandler, QueryType, QueryUnregister } from "./plugin/queries/queries";
export { QueryBus } from "./plugin/queries/query-bus";
export { QueriesPlugin } from "./plugin/queries/queries-plugin";
export { OnQuery, OnQueryHandlerDecorator } from "./plugin/queries/on-query";
export { WirestatePlugin } from "./plugin/plugin";

export { OnDeprovision } from "./provision/on-deprovision";
export { OnProvision } from "./provision/on-provision";

export { Newable } from "./types/general";
