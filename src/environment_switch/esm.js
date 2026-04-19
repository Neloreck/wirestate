/*
 * 'https://github.com/Neloreck/wirestate'
 */

import {
  Action as DAction,
  Computed as DComputed,
  Container as DContainer,
  DeepObservable as DDeepObservable,
  INITIAL_STATE as DINITIAL_STATE,
  InitialState as DInitialState,
  Inject as DInject,
  Injectable as DInjectable,
  IocProvider as DIocProvider,
  Observable as DObservable,
  OnQuery as DOnQuery,
  OnSignal as DOnSignal,
  RefObservable as DRefObservable,
  ShallowObservable as DShallowObservable,
  AbstractService as DAbstractService,
  applyInitialState as DapplyInitialState,
  autorun as Dautorun,
  bindConstant as DbindConstant,
  bindEntry as DbindEntry,
  bindService as DbindService,
  createIocContainer as DcreateIocContainer,
  createServicesProvider as DcreateServicesProvider,
  emitSignal as DemitSignal,
  flow as Dflow,
  flowResult as DflowResult,
  forwardRef as DforwardRef,
  isFlow as DisFlow,
  isFlowCancellationError as DisFlowCancellationError,
  makeAutoObservable as DmakeAutoObservable,
  makeObservable as DmakeObservable,
  observer as Dobserver,
  query as Dquery,
  runInAction as DrunInAction,
  useContainer as DuseContainer,
  useContainerRevision as DuseContainerRevision,
  useQueryCaller as DuseQueryCaller,
  useQueryHandler as DuseQueryHandler,
  useInjection as DuseInjection,
  useSignal as DuseSignal,
  useSignalEmitter as DuseSignalEmitter,
  useSyncQueryCaller as DuseSyncQueryCaller,
} from "./development";
import {
  Action as PAction,
  Computed as PComputed,
  Container as PContainer,
  DeepObservable as PDeepObservable,
  INITIAL_STATE as PINITIAL_STATE,
  InitialState as PInitialState,
  Inject as PInject,
  Injectable as PInjectable,
  IocProvider as PIocProvider,
  Observable as PObservable,
  OnQuery as POnQuery,
  OnSignal as POnSignal,
  RefObservable as PRefObservable,
  ShallowObservable as PShallowObservable,
  AbstractService as PAbstractService,
  applyInitialState as PapplyInitialState,
  autorun as Pautorun,
  bindConstant as PbindConstant,
  bindEntry as PbindEntry,
  bindService as PbindService,
  createIocContainer as PcreateIocContainer,
  createServicesProvider as PcreateServicesProvider,
  emitSignal as PemitSignal,
  flow as Pflow,
  flowResult as PflowResult,
  forwardRef as PforwardRef,
  isFlow as PisFlow,
  isFlowCancellationError as PisFlowCancellationError,
  makeAutoObservable as PmakeAutoObservable,
  makeObservable as PmakeObservable,
  observer as Pobserver,
  query as Pquery,
  runInAction as PrunInAction,
  useContainer as PuseContainer,
  useContainerRevision as PuseContainerRevision,
  useQueryCaller as PuseQueryCaller,
  useQueryHandler as PuseQueryHandler,
  useInjection as PuseInjection,
  useSignal as PuseSignal,
  useSignalEmitter as PuseSignalEmitter,
  useSyncQueryCaller as PuseSyncQueryCaller,
} from "./production";

export const Action = process.env.NODE_ENV === "production" ? PAction : DAction;
export const Computed = process.env.NODE_ENV === "production" ? PComputed : DComputed;
export const Container = process.env.NODE_ENV === "production" ? PContainer : DContainer;
export const DeepObservable = process.env.NODE_ENV === "production" ? PDeepObservable : DDeepObservable;
export const INITIAL_STATE = process.env.NODE_ENV === "production" ? PINITIAL_STATE : DINITIAL_STATE;
export const InitialState = process.env.NODE_ENV === "production" ? PInitialState : DInitialState;
export const Inject = process.env.NODE_ENV === "production" ? PInject : DInject;
export const Injectable = process.env.NODE_ENV === "production" ? PInjectable : DInjectable;
export const IocProvider = process.env.NODE_ENV === "production" ? PIocProvider : DIocProvider;
export const Observable = process.env.NODE_ENV === "production" ? PObservable : DObservable;
export const OnQuery = process.env.NODE_ENV === "production" ? POnQuery : DOnQuery;
export const OnSignal = process.env.NODE_ENV === "production" ? POnSignal : DOnSignal;
export const RefObservable = process.env.NODE_ENV === "production" ? PRefObservable : DRefObservable;
export const ShallowObservable = process.env.NODE_ENV === "production" ? PShallowObservable : DShallowObservable;
export const AbstractService = process.env.NODE_ENV === "production" ? PAbstractService : DAbstractService;
export const applyInitialState = process.env.NODE_ENV === "production" ? PapplyInitialState : DapplyInitialState;
export const autorun = process.env.NODE_ENV === "production" ? Pautorun : Dautorun;
export const bindConstant = process.env.NODE_ENV === "production" ? PbindConstant : DbindConstant;
export const bindEntry = process.env.NODE_ENV === "production" ? PbindEntry : DbindEntry;
export const bindService = process.env.NODE_ENV === "production" ? PbindService : DbindService;
export const createIocContainer = process.env.NODE_ENV === "production" ? PcreateIocContainer : DcreateIocContainer;
export const createServicesProvider =
  process.env.NODE_ENV === "production" ? PcreateServicesProvider : DcreateServicesProvider;
export const emitSignal = process.env.NODE_ENV === "production" ? PemitSignal : DemitSignal;
export const flow = process.env.NODE_ENV === "production" ? Pflow : Dflow;
export const flowResult = process.env.NODE_ENV === "production" ? PflowResult : DflowResult;
export const forwardRef = process.env.NODE_ENV === "production" ? PforwardRef : DforwardRef;
export const isFlow = process.env.NODE_ENV === "production" ? PisFlow : DisFlow;
export const isFlowCancellationError =
  process.env.NODE_ENV === "production" ? PisFlowCancellationError : DisFlowCancellationError;
export const makeAutoObservable = process.env.NODE_ENV === "production" ? PmakeAutoObservable : DmakeAutoObservable;
export const makeObservable = process.env.NODE_ENV === "production" ? PmakeObservable : DmakeObservable;
export const observer = process.env.NODE_ENV === "production" ? Pobserver : Dobserver;
export const query = process.env.NODE_ENV === "production" ? Pquery : Dquery;
export const runInAction = process.env.NODE_ENV === "production" ? PrunInAction : DrunInAction;
export const useContainer = process.env.NODE_ENV === "production" ? PuseContainer : DuseContainer;
export const useContainerRevision =
  process.env.NODE_ENV === "production" ? PuseContainerRevision : DuseContainerRevision;
export const useQueryCaller = process.env.NODE_ENV === "production" ? PuseQueryCaller : DuseQueryCaller;
export const useQueryHandler = process.env.NODE_ENV === "production" ? PuseQueryHandler : DuseQueryHandler;
export const useInjection = process.env.NODE_ENV === "production" ? PuseInjection : DuseInjection;
export const useSignal = process.env.NODE_ENV === "production" ? PuseSignal : DuseSignal;
export const useSignalEmitter = process.env.NODE_ENV === "production" ? PuseSignalEmitter : DuseSignalEmitter;
export const useSyncQueryCaller = process.env.NODE_ENV === "production" ? PuseSyncQueryCaller : DuseSyncQueryCaller;
