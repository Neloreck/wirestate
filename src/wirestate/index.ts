/*
 * 'https://github.com/Neloreck/wirestate'
 */

export * from "@/wirestate/alias";

export { bindEntry } from "@/wirestate/bind/bind-entry";
export { bindConstant } from "@/wirestate/bind/bind-constant";
export { bindService } from "@/wirestate/bind/bind-service";
export { getEntryToken } from "@/wirestate/bind/get-entry-token";

export { createIocContainer } from "@/wirestate/container/create-ioc-container";
export { command } from "@/wirestate/commands/command";
export { commandOptional } from "@/wirestate/commands/command-optional";
export { emitEvent } from "@/wirestate/events/emit-event";
export { query } from "@/wirestate/queries/query";
export { queryOptional } from "@/wirestate/queries/query-optional";
export { OnCommand } from "@/wirestate/commands/on-command";
export { CommandBus } from "@/wirestate/commands/command-bus";

export { WirestateError } from "@/wirestate/error/wirestate-error";

export { OnEvent } from "@/wirestate/events/on-event";
export { EventBus } from "@/wirestate/events/event-bus";

export {
  SEED_TOKEN as SEED,
  SEEDS_TOKEN as SEEDS,
  COMMAND_BUS_TOKEN as COMMAND_BUS,
  EVENT_BUS_TOKEN as EVENT_BUS,
  QUERY_BUS_TOKEN as QUERY_BUS,
} from "@/wirestate/registry";

export { applySeeds } from "@/wirestate/seeds/apply-seeds";
export { applySharedSeed } from "@/wirestate/seeds/apply-shared-seed";
export { unapplySeeds } from "@/wirestate/seeds/unapply-seeds";

export { WireScope } from "@/wirestate/scope/wire-scope";

export { OnActivated } from "@/wirestate/service/on-activated";
export { OnDeactivation } from "@/wirestate/service/on-deactivation";

export { QueryBus } from "@/wirestate/queries/query-bus";
export { OnQuery } from "@/wirestate/queries/on-query";

export { MaybePromise } from "@/wirestate/types/general";
export {
  TSeedEntries as SeedEntries,
  TSeedEntry as SeedEntry,
  TSeedKey as SeedKey,
} from "@/wirestate/types/initial-state";
export { IInjectableDescriptor as InjectableDescriptor } from "@/wirestate/types/privision";
export {
  ECommandStatus as CommandStatus,
  ICommandDescriptor as CommandDescriptor,
  TCommandHandler as CommandHandler,
  TCommandType as CommandType,
  TCommandUnregister as CommandUnregister,
  TCommandCaller as CommandCaller,
  TOptionalCommandCaller as OptionalCommandCaller,
} from "@/wirestate/types/commands";
export {
  TOptionalQueryCaller as OptionalQueryCaller,
  TOptionalSyncQueryCaller as OptionalSyncQueryCaller,
  TQueryCaller as QueryCaller,
  TQueryHandler as QueryHandler,
  TQueryResponder as QueryResponder,
  TQueryType as QueryType,
  TQueryUnregister as QueryUnregister,
  TSyncQueryCaller as SyncQueryCaller,
} from "@/wirestate/types/queries";
export {
  IEvent as Event,
  TEventEmitter as EventEmitter,
  TEventHandler as EventHandler,
  TEventType as EventType,
  TEventUnsubscriber as EventUnsubscriber,
} from "@/wirestate/types/events";
