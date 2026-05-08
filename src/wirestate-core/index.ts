/*
 * 'https://github.com/Neloreck/wirestate'
 */

export * from "@/wirestate-core/alias";

export { bindEntry } from "@/wirestate-core/bind/bind-entry";
export { bindConstant } from "@/wirestate-core/bind/bind-constant";
export { bindService } from "@/wirestate-core/bind/bind-service";
export { getEntryToken } from "@/wirestate-core/bind/get-entry-token";

export { command } from "@/wirestate-core/commands/command";
export { commandOptional } from "@/wirestate-core/commands/command-optional";
export { OnCommand } from "@/wirestate-core/commands/on-command";
export { CommandBus } from "@/wirestate-core/commands/command-bus";

export { createIocContainer } from "@/wirestate-core/container/create-ioc-container";
export { WireScope } from "@/wirestate-core/container/wire-scope";

export { WirestateError } from "@/wirestate-core/error/wirestate-error";

export { emitEvent } from "@/wirestate-core/events/emit-event";
export { OnEvent } from "@/wirestate-core/events/on-event";
export { EventBus } from "@/wirestate-core/events/event-bus";

export { query } from "@/wirestate-core/queries/query";
export { queryOptional } from "@/wirestate-core/queries/query-optional";
export { QueryBus } from "@/wirestate-core/queries/query-bus";
export { OnQuery } from "@/wirestate-core/queries/on-query";

export { SEED_TOKEN as SEED, SEEDS_TOKEN as SEEDS } from "@/wirestate-core/registry";

export { applySeeds } from "@/wirestate-core/seeds/apply-seeds";
export { applySharedSeed } from "@/wirestate-core/seeds/apply-shared-seed";
export { unapplySeeds } from "@/wirestate-core/seeds/unapply-seeds";

export { OnActivated } from "@/wirestate-core/service/on-activated";
export { OnDeactivation } from "@/wirestate-core/service/on-deactivation";

export { SeedEntries, SeedEntry, SeedKey } from "@/wirestate-core/types/initial-state";
export { InjectableDescriptor } from "@/wirestate-core/types/privision";
export {
  CommandStatus,
  CommandDescriptor,
  CommandHandler,
  CommandType,
  CommandUnregister,
} from "@/wirestate-core/types/commands";
export { QueryHandler, QueryType, QueryUnregister } from "@/wirestate-core/types/queries";
export { Event, EventHandler, EventType, EventUnsubscriber } from "@/wirestate-core/types/events";
