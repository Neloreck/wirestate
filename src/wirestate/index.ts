/*
 * 'https://github.com/Neloreck/wirestate'
 */

export * from "@/wirestate/alias";
export { bindEntry } from "@/wirestate/core/container/bind/bind-entry";
export { bindConstant } from "@/wirestate/core/container/bind/bind-constant";
export { bindService } from "@/wirestate/core/container/bind/bind-service";
export { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
export { emitSignal } from "@/wirestate/core/container/emit-signal";
export { query } from "@/wirestate/core/container/query";
export {
  createInjectablesProvider,
  InjectablesProvider,
  IInjectablesProviderProps as InjectablesProviderProps,
} from "@/wirestate/core/provision/create-injectables-provider";
export { IocProvider } from "@/wirestate/core/provision/ioc-provider";
export { useContainer } from "@/wirestate/core/provision/use-container";
export { useContainerRevision } from "@/wirestate/core/provision/use-container-revision";
export { OnQuery } from "@/wirestate/core/queries/on-query";
export { useQueryCaller } from "@/wirestate/core/queries/use-query-caller";
export { useOptionalQueryCaller } from "@/wirestate/core/queries/use-optional-query-caller";
export { useQueryHandler } from "@/wirestate/core/queries/use-query-handler";
export { useSyncQueryCaller } from "@/wirestate/core/queries/use-sync-query-caller";
export { useOptionalSyncQueryCaller } from "@/wirestate/core/queries/use-optional-sync-query-caller";
export { INITIAL_STATE_TOKEN as INITIAL_STATE } from "@/wirestate/core/registry";
export { AbstractService } from "@/wirestate/core/service/abstract-service";
export { useInjection } from "@/wirestate/core/service/use-injection";
export { useOptionalInjection } from "@/wirestate/core/service/use-optional-injection";
export { OnSignal } from "@/wirestate/core/signals/on-signal";
export { useSignal } from "@/wirestate/core/signals/use-signal";
export { useSignals } from "@/wirestate/core/signals/use-signals";
export { useSignalHandler } from "@/wirestate/core/signals/use-signal-handler";
export { useSignalEmitter } from "@/wirestate/core/signals/use-signal-emitter";
export {
  TInitialStateEntries as InitialStateEntries,
  TInitialStateEntry as InitialStateEntry,
  TInitialStateKey as InitialStateKey,
} from "@/wirestate/types/initial-state";
export { IInjectableDescriptor as InjectableDescriptor } from "@/wirestate/types/privision";
export {
  TQueryHandler as QueryHandler,
  TQueryResponder as QueryResponder,
  TQueryType as QueryType,
  TQueryUnregister as QueryUnregister,
} from "@/wirestate/types/queries";
export { TServiceClass as ServiceClass } from "@/wirestate/types/services";
export {
  ISignal as Signal,
  TSignalEmitter as SignalEmitter,
  TSignalHandler as SignalHandler,
  TSignalType as SignalType,
  TSignalUnsubscribe as SignalUnsubscribe,
} from "@/wirestate/types/signals";
export { queryOptional } from "@/wirestate/core/container/query-optional";
