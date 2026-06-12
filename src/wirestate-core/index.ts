/**
 * Framework-agnostic Wirestate APIs for containers, services, lifecycle, messaging, seeds, and dependency injection.
 *
 * @packageDocumentation
 */

export {
  Binding,
  BindingDescriptor,
  Bindings,
  BindingScope,
  BindingType,
  FactoryBindingDescriptor,
  InstanceBindingDescriptor,
  ValueBindingDescriptor,
} from "./binding/binding";
export { Newable } from "./binding/binding-class";
export { Identifier, InjectionToken } from "./binding/binding-tokens";

export { Container, ContainerConfig, ContainerOptions } from "./container/container";
export { inject } from "./container/context";
export { SEED_TOKEN as SEED, SEEDS_TOKEN as SEEDS } from "./container/seeds";
export { deprovisionContainer, provisionContainer } from "./container/container-provision-lifecycle";
export { ContainerProvisionLifecycle } from "./container/provision-state";
export { ProvisionId, WireStatus } from "./container/wire-status";
export { validateContainerConfig } from "./container/validate-container-config";
export { WireScope } from "./container/wire-scope";

export { InternalErrorHandler, InternalErrorDescriptor, InternalErrorSource } from "./error/error";
export { defaultInternalErrorHandler } from "./error/internal-error-handler";
export { WirestateError } from "./error/wirestate-error";

export { OnActivated } from "./lifecycle/on-activated";
export { OnDeactivation } from "./lifecycle/on-deactivation";
export { OnDeprovision } from "./lifecycle/on-deprovision";
export { OnProvision } from "./lifecycle/on-provision";

export { Injectable, isInjectable } from "./metadata/injectable";

export { CommandBus } from "./messaging/commands/command-bus";
export { CommandHandler, CommandType, CommandUnregister } from "./messaging/commands/commands";
export { OnCommand, OnCommandHandlerDecorator } from "./messaging/commands/on-command";
export { OnEvent, OnEventHandlerDecorator } from "./messaging/events/on-event";
export { EventBus } from "./messaging/events/event-bus";
export { EventEmitOptions, EventHandler, EventType, EventUnsubscriber, WireEvent } from "./messaging/events/events";
export { QueryHandler, QueryType, QueryUnregister } from "./messaging/queries/queries";
export { QueryBus } from "./messaging/queries/query-bus";
export { OnQuery, OnQueryHandlerDecorator } from "./messaging/queries/on-query";

export { SeedsMap, SeedBindings, SeedBinding, SeedKey } from "./types/seeds";
