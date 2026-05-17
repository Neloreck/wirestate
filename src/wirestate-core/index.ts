/*
 * 'https://github.com/Neloreck/wirestate'
 */

export * from "./alias";

export { bindConstant } from "./bind/bind-constant";
export { bindDynamicValue } from "./bind/bind-dynamic-value";
export { bindEntry, BindEntryOptions } from "./bind/bind-entry";
export { bindService, BindServiceOptions } from "./bind/bind-service";
export { getEntryToken } from "./bind/get-entry-token";

export { command } from "./commands/command";
export { commandOptional } from "./commands/command-optional";
export { OnCommand } from "./commands/on-command";
export { CommandBus } from "./commands/command-bus";

export { createContainer, CreateContainerOptions } from "./container/create-container";
export { WireScope } from "./container/wire-scope";

export { WirestateError } from "./error/wirestate-error";

export { emitEvent } from "./events/emit-event";
export { OnEvent } from "./events/on-event";
export { EventBus } from "./events/event-bus";

export { query } from "./queries/query";
export { queryOptional } from "./queries/query-optional";
export { QueryBus } from "./queries/query-bus";
export { OnQuery } from "./queries/on-query";

export { SEEDS_TOKEN as SEEDS } from "@wirestate/core/seeds/tokens";
export { SEED_TOKEN as SEED } from "@wirestate/core/seeds/tokens";
export { applySeeds } from "./seeds/apply-seeds";
export { applySharedSeed } from "./seeds/apply-shared-seed";
export { unapplySeeds } from "./seeds/unapply-seeds";

export { OnActivated } from "./service/on-activated";
export { OnDeactivation } from "./service/on-deactivation";

export { SeedsMap, SeedEntries, SeedEntry, SeedKey } from "./types/initial-state";
export { InjectableDescriptor } from "./types/privision";
export { CommandStatus, CommandDescriptor, CommandHandler, CommandType, CommandUnregister } from "./types/commands";
export { QueryHandler, QueryType, QueryUnregister } from "./types/queries";
export { Event, EventHandler, EventType, EventUnsubscriber } from "./types/events";
