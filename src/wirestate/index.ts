/*
 * 'https://github.com/Neloreck/wirestate'
 */

export * from "@/wirestate/alias";

export { bindEntry } from "@/wirestate/core/bind/bind-entry";
export { bindConstant } from "@/wirestate/core/bind/bind-constant";
export { bindService } from "@/wirestate/core/bind/bind-service";

export { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
export { command } from "@/wirestate/core/container/command";
export { commandOptional } from "@/wirestate/core/container/command-optional";
export { emitEvent } from "@/wirestate/core/container/emit-event";
export { query } from "@/wirestate/core/container/query";
export { queryOptional } from "@/wirestate/core/container/query-optional";

export { WirestateError } from "@/wirestate/core/error/wirestate-error";

export { OnCommand } from "@/wirestate/core/commands/on-command";

export { OnQuery } from "@/wirestate/core/queries/on-query";

export { SEED_TOKEN as SEED } from "@/wirestate/core/registry";

export { WireScope } from "@/wirestate/core/scope/wire-scope";

export { OnActivated } from "@/wirestate/core/service/on-activated";
export { OnDeactivation } from "@/wirestate/core/service/on-deactivation";

export { OnEvent } from "@/wirestate/core/events/on-event";

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
