/**
 * Framework-agnostic Wirestate APIs for containers, services, lifecycle, messaging, seeds, and dependency injection.
 *
 * @packageDocumentation
 */

export {
  BindingScope,
  BindingType,
  CircularDependencyError,
  Container,
  Identifier,
  Injectable,
  InjectionToken,
  Newable,
  NoBindingFoundError,
  inject,
  isInjectable,
} from "./base";

export { bind, BindOptions } from "./bind/bind";
export { unbind, unbindAll } from "./bind/unbind";
export { OnActivated } from "./bind/instance/on-activated";
export { OnDeactivation } from "./bind/instance/on-deactivation";
export { OnDeprovision } from "./bind/instance/on-deprovision";
export { OnProvision } from "./bind/instance/on-provision";

export { OnCommand, OnCommandHandlerDecorator } from "./commands/on-command";
export { CommandBus } from "./commands/command-bus";

export { createContainer, ContainerConfig, CreateContainerOptions } from "./container/create-container";
export {
  ContainerProvisionLifecycle,
  deprovisionContainer,
  provisionContainer,
} from "./container/container-provision-lifecycle";
export { WireStatus } from "./container/wire-status";
export { validateContainerConfig } from "./container/validate-container-config";
export { WireScope } from "./container/wire-scope";

export { WirestateError } from "./error/wirestate-error";
export { defaultInternalErrorHandler } from "./error/internal-error-handler";

export { OnEvent, OnEventHandlerDecorator } from "./events/on-event";
export { EventBus } from "./events/event-bus";

export { QueryBus } from "./queries/query-bus";
export { OnQuery, OnQueryHandlerDecorator } from "./queries/on-query";

export { SEED_TOKEN as SEED, SEEDS_TOKEN as SEEDS } from "./registry";

export { CommandHandler, CommandType, CommandUnregister } from "./types/commands";
export { InternalErrorHandler, InternalErrorDescriptor, InternalErrorSource } from "./types/error";
export { EventEmitOptions, EventHandler, EventType, EventUnsubscriber, WireEvent } from "./types/events";
export {
  BindingDescriptor,
  Binding,
  Bindings,
  ValueBindingDescriptor,
  FactoryBindingDescriptor,
  InstanceBindingDescriptor,
  ProvisionId,
} from "./types/provision";
export { QueryHandler, QueryType, QueryUnregister } from "./types/queries";
export { SeedsMap, SeedBindings, SeedBinding, SeedKey } from "./types/seeds";
