/*
 * 'https://github.com/Neloreck/wirestate'
 */

export * from "@/wirestate/alias";
export { bindService } from "@/wirestate/core/container/bindService";
export { createIocContainer } from "@/wirestate/core/container/createIocContainer";
export { emitSignal } from "@/wirestate/core/container/emitSignal";
export { query } from "@/wirestate/core/container/query";
export { applyInitialState } from "@/wirestate/core/initial-state/applyInitialState";
export { InitialState } from "@/wirestate/core/initial-state/InitialState";
export {
  createServicesProvider,
  ServicesProvider,
  IServicesProviderProps as ServicesProviderProps,
} from "@/wirestate/core/provision/createServicesProvider";
export { IocProvider } from "@/wirestate/core/provision/IocProvider";
export { useContainer } from "@/wirestate/core/provision/useContainer";
export { useContainerRevision } from "@/wirestate/core/provision/useContainerRevision";
export { OnQuery } from "@/wirestate/core/queries/OnQuery";
export { useQueryCaller } from "@/wirestate/core/queries/useQueryCaller";
export { useQueryHandler } from "@/wirestate/core/queries/useQueryHandler";
export { useSyncQueryCaller } from "@/wirestate/core/queries/useSyncQueryCaller";
export { INITIAL_STATE_SHARED_TOKEN as INITIAL_STATE } from "@/wirestate/core/registry";
export { AbstractService } from "@/wirestate/core/service/abstract-service";
export { useService } from "@/wirestate/core/service/useService";
export { OnSignal } from "@/wirestate/core/signals/OnSignal";
export { useSignal } from "@/wirestate/core/signals/useSignal";
export { useSignalEmitter } from "@/wirestate/core/signals/useSignalEmitter";
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
