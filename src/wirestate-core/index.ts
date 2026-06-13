/**
 * Framework-agnostic Wirestate APIs for containers, services, lifecycle, messaging, seeds, and dependency injection.
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
  Identifier,
  InstanceBindingDescriptor,
  ValueBindingDescriptor,
} from "./binding/binding";
export { InjectionToken } from "./binding/binding-tokens";

export { Container, ContainerConfig, ContainerOptions } from "./container/container";
export { inject } from "./container/container-context";
export { validateContainerConfig } from "./container/container-config-validation";
export { SEED_TOKEN as SEED, SEEDS_TOKEN as SEEDS } from "./container/container-seeds";

export { InternalErrorHandler, InternalErrorDescriptor, InternalErrorSource } from "./error/error";
export { defaultInternalErrorHandler } from "./error/internal-error-handler";
export { WirestateError } from "./error/wirestate-error";

export { CommandBus } from "./messaging/commands/command-bus";
export { CommandHandler, CommandType, CommandUnregister } from "./messaging/commands/commands";
export { OnCommand, OnCommandHandlerDecorator } from "./messaging/commands/on-command";
export { OnEvent, OnEventHandlerDecorator } from "./messaging/events/on-event";
export { EventBus } from "./messaging/events/event-bus";
export { EventEmitOptions, EventHandler, EventType, EventUnsubscriber, WireEvent } from "./messaging/events/events";
export { QueryHandler, QueryType, QueryUnregister } from "./messaging/queries/queries";
export { QueryBus } from "./messaging/queries/query-bus";
export { OnQuery, OnQueryHandlerDecorator } from "./messaging/queries/on-query";

export { Injectable, isInjectable } from "./metadata/metadata-injectable";

export { deprovisionContainer, provisionContainer } from "./provision/provision-lifecycle";
export { OnDeprovision } from "./provision/on-deprovision";
export { OnProvision } from "./provision/on-provision";
export { ContainerProvisionLifecycle } from "./provision/provision-state";

export { WireScope } from "./scope/wire-scope";

export { Newable } from "./types/general";
export { SeedsMap, SeedBindings, SeedBinding, SeedKey } from "./types/seeds";
