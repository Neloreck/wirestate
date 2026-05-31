/**
 * Framework-agnostic Wirestate APIs for containers, services, lifecycle, messaging, seeds, and dependency injection.
 *
 * @packageDocumentation
 */

export * from "./alias";

export { bind, BindOptions } from "./bind/bind";
export { unbind, unbindAll } from "./bind/unbind";

export { OnCommand } from "./commands/on-command";
export { CommandBus } from "./commands/command-bus";

export {
  createContainer,
  ContainerActivation,
  ContainerConfig,
  CreateContainerOptions,
} from "./container/create-container";
export { validateContainerConfig } from "./container/validate-container-config";
export { WireScope } from "./container/wire-scope";

export { WirestateError } from "./error/wirestate-error";

export { OnEvent } from "./events/on-event";
export { EventBus } from "./events/event-bus";

export { QueryBus } from "./queries/query-bus";
export { OnQuery } from "./queries/on-query";

export { SEEDS_TOKEN as SEEDS } from "./seeds/tokens";
export { SEED_TOKEN as SEED } from "./seeds/tokens";
export { setSeeds } from "./seeds/set-seeds";
export { setSharedSeed } from "./seeds/set-shared-seed";
export { unsetSeeds } from "./seeds/unset-seeds";

export { OnActivated } from "./service/on-activated";
export { OnDeactivation } from "./service/on-deactivation";
export { OnDeprovision } from "./service/on-deprovision";
export { OnProvision } from "./service/on-provision";
export { ProvisionLifecycle, deprovisionContainer, provisionContainer } from "./service/provision-lifecycle";

export { CommandHandler, CommandType, CommandUnregister } from "./types/commands";
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
