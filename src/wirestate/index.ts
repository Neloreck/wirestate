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
export {
  createInjectablesProvider,
  InjectablesProvider,
  IInjectablesProviderProps as InjectablesProviderProps,
} from "@/wirestate/core/provision/create-injectables-provider";
export { IocProvider } from "@/wirestate/core/provision/ioc-provider";
export { useContainer } from "@/wirestate/core/provision/use-container";
export { useContainerRevision } from "@/wirestate/core/provision/use-container-revision";
export { OnCommand } from "@/wirestate/core/commands/on-command";
export { useCommandCaller } from "@/wirestate/core/commands/use-command-caller";
export { useOptionalCommandCaller } from "@/wirestate/core/commands/use-optional-command-caller";
export { useCommandHandler } from "@/wirestate/core/commands/use-command-handler";
export { OnQuery } from "@/wirestate/core/queries/on-query";
export { useQueryCaller } from "@/wirestate/core/queries/use-query-caller";
export { useOptionalQueryCaller } from "@/wirestate/core/queries/use-optional-query-caller";
export { useQueryHandler } from "@/wirestate/core/queries/use-query-handler";
export { useSyncQueryCaller } from "@/wirestate/core/queries/use-sync-query-caller";
export { useOptionalSyncQueryCaller } from "@/wirestate/core/queries/use-optional-sync-query-caller";
export { SEED_TOKEN as SEED } from "@/wirestate/core/registry";
export { WireScope } from "@/wirestate/core/scope/wire-scope";
export { OnActivated } from "@/wirestate/core/service/on-activated";
export { OnDeactivation } from "@/wirestate/core/service/on-deactivation";
export { useInjection } from "@/wirestate/core/provision/use-injection";
export { useOptionalInjection } from "@/wirestate/core/provision/use-optional-injection";
export { OnEvent } from "@/wirestate/core/events/on-event";
export { useEvent } from "@/wirestate/core/events/use-event";
export { useEvents } from "@/wirestate/core/events/use-events";
export { useEventsHandler } from "./core/events/use-events-handler";
export { useEventEmitter } from "@/wirestate/core/events/use-event-emitter";
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
  TQueryHandler as QueryHandler,
  TQueryResponder as QueryResponder,
  TQueryType as QueryType,
  TQueryUnregister as QueryUnregister,
} from "@/wirestate/types/queries";
export {
  IEvent as Event,
  TEventEmitter as EventEmitter,
  TEventHandler as EventHandler,
  TEventType as EventType,
  TEventUnsubscriber as EventUnsubscriber,
} from "@/wirestate/types/events";
