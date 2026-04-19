/*
 * 'https://github.com/Neloreck/wirestate'
 */

export * from "@/wirestate/alias";
export { bindService } from "@/wirestate/core/container/bind-service";
export { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
export { emitSignal } from "@/wirestate/core/container/emit-signal";
export { query } from "@/wirestate/core/container/query";
export { applyInitialState } from "@/wirestate/core/initial-state/apply-initial-state";
export { InitialState } from "@/wirestate/core/initial-state/initial-state";
export {
  createServicesProvider,
  ServicesProvider,
  IServicesProviderProps as ServicesProviderProps,
} from "@/wirestate/core/provision/create-services-provider";
export { IocProvider } from "@/wirestate/core/provision/ioc-provider";
export { useContainer } from "@/wirestate/core/provision/use-container";
export { useContainerRevision } from "@/wirestate/core/provision/use-container-revision";
export { OnQuery } from "@/wirestate/core/queries/on-query";
export { useQueryCaller } from "@/wirestate/core/queries/use-query-caller";
export { useQueryHandler } from "@/wirestate/core/queries/use-query-handler";
export { useSyncQueryCaller } from "@/wirestate/core/queries/use-sync-query-caller";
export { INITIAL_STATE_SHARED_TOKEN as INITIAL_STATE } from "@/wirestate/core/registry";
export { AbstractService } from "@/wirestate/core/service/abstract-service";
export { useService } from "@/wirestate/core/service/use-service";
export { OnSignal } from "@/wirestate/core/signals/on-signal";
export { useSignal } from "@/wirestate/core/signals/use-signal";
export { useSignalEmitter } from "@/wirestate/core/signals/use-signal-emitter";
export {
  TInitialStateEntries as InitialStateEntries,
  TInitialStateEntry as InitialStateEntry,
  TInitialStateKey as InitialStateKey,
} from "@/wirestate/types/initial-state";
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
