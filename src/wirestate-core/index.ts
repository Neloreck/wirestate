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

export { OnCommand, OnCommandHandlerDecorator } from "./commands/on-command";
export { CommandBus } from "./commands/command-bus";

export { Container, ContainerConfig, ContainerOptions } from "./container/container";
export { inject } from "./container/context";
export { SEED_TOKEN as SEED, SEEDS_TOKEN as SEEDS } from "./container/seeds";
export { deprovisionContainer, provisionContainer } from "./container/container-provision-lifecycle";
export { ContainerProvisionLifecycle } from "./container/provision-state";
export { ProvisionId, WireStatus } from "./container/wire-status";
export { validateContainerConfig } from "./container/validate-container-config";
export { WireScope } from "./container/wire-scope";

export { WirestateError } from "./error/wirestate-error";
export { defaultInternalErrorHandler } from "./error/internal-error-handler";

export { OnEvent, OnEventHandlerDecorator } from "./events/on-event";
export { EventBus } from "./events/event-bus";

export { OnActivated } from "./lifecycle/on-activated";
export { OnDeactivation } from "./lifecycle/on-deactivation";
export { OnDeprovision } from "./lifecycle/on-deprovision";
export { OnProvision } from "./lifecycle/on-provision";

export { Injectable, isInjectable } from "./metadata/injectable";

export { QueryBus } from "./queries/query-bus";
export { OnQuery, OnQueryHandlerDecorator } from "./queries/on-query";

export { CommandHandler, CommandType, CommandUnregister } from "./types/commands";
export { InternalErrorHandler, InternalErrorDescriptor, InternalErrorSource } from "./types/error";
export { EventEmitOptions, EventHandler, EventType, EventUnsubscriber, WireEvent } from "./types/events";
export { QueryHandler, QueryType, QueryUnregister } from "./types/queries";
export { SeedsMap, SeedBindings, SeedBinding, SeedKey } from "./types/seeds";
