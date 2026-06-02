/**
 * Framework-agnostic Wirestate APIs for containers, services, lifecycle, messaging, seeds, and dependency injection.
 *
 * @packageDocumentation
 */

export * from "./alias";

export { bind, BindOptions } from "./bind/bind";
export { unbind, unbindAll } from "./bind/unbind";
export { OnActivated } from "./bind/instance/on-activated";
export { OnDeactivation } from "./bind/instance/on-deactivation";
export { OnDeprovision } from "./bind/instance/on-deprovision";
export { OnProvision } from "./bind/instance/on-provision";

export { OnCommand } from "./commands/on-command";
export { CommandBus } from "./commands/command-bus";

export { createContainer, ContainerConfig, CreateContainerOptions } from "./container/create-container";
export {
  ContainerProvisionLifecycle,
  deprovisionContainer,
  provisionContainer,
} from "./container/container-provision-lifecycle";
export { validateContainerConfig } from "./container/validate-container-config";
export { WireScope } from "./container/wire-scope";

export { WirestateError } from "./error/wirestate-error";
export { defaultInternalErrorHandler } from "./error/internal-error-handler";

export { OnEvent } from "./events/on-event";
export { EventBus } from "./events/event-bus";

export { QueryBus } from "./queries/query-bus";
export { OnQuery } from "./queries/on-query";

export { SEED_TOKEN as SEED, SEEDS_TOKEN as SEEDS } from "./registry";

export { CommandHandler, CommandType, CommandUnregister } from "./types/commands";
export { InternalErrorHandler, InternalErrorDescriptor, InternalErrorSource } from "./types/error";
export { EventEmitOptions, EventHandler, EventType, EventUnsubscriber, WireEvent } from "./types/events";
export {
  BindingDescriptor,
  Binding,
  Bindings,
  ConstantValueBindingDescriptor,
  DynamicValueBindingDescriptor,
  FactoryBindingDescriptor,
  InstanceBindingDescriptor,
  ResolvedValueBindingDescriptor,
  ServiceRedirectionBindingDescriptor,
} from "./types/provision";
export { QueryHandler, QueryType, QueryUnregister } from "./types/queries";
export { SeedsMap, SeedBindings, SeedBinding, SeedKey } from "./types/seeds";
