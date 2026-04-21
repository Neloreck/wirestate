/*
 * 'https://github.com/Neloreck/wirestate'
 */

import {
  Action as DAction,
  Computed as DComputed,
  Container as DContainer,
  ContainerModule as DContainerModule,
  DeepObservable as DDeepObservable,
  INITIAL_STATE as DINITIAL_STATE,
  Inject as DInject,
  Injectable as DInjectable,
  IocProvider as DIocProvider,
  MultiInject as DMultiInject,
  Named as DNamed,
  Observable as DObservable,
  OnQuery as DOnQuery,
  OnSignal as DOnSignal,
  Optional as DOptional,
  PostConstruct as DPostConstruct,
  PreDestroy as DPreDestroy,
  RefObservable as DRefObservable,
  ShallowObservable as DShallowObservable,
  Tagged as DTagged,
  AbstractService as DAbstractService,
  autorun as Dautorun,
  bindConstant as DbindConstant,
  bindEntry as DbindEntry,
  bindService as DbindService,
  comparer as Dcomparer,
  configure as Dconfigure,
  createIocContainer as DcreateIocContainer,
  createInjectablesProvider as DcreateInjectablesProvider,
  emitSignal as DemitSignal,
  flow as Dflow,
  flowResult as DflowResult,
  forwardRef as DforwardRef,
  isAction as DisAction,
  isFlow as DisFlow,
  isFlowCancellationError as DisFlowCancellationError,
  isObservable as DisObservable,
  makeAutoObservable as DmakeAutoObservable,
  makeObservable as DmakeObservable,
  observer as Dobserver,
  query as Dquery,
  queryOptional as DqueryOptional,
  reaction as Dreaction,
  runInAction as DrunInAction,
  toJS as DtoJS,
  useContainer as DuseContainer,
  useContainerRevision as DuseContainerRevision,
  useInjection as DuseInjection,
  useOptionalInjection as DuseOptionalInjection,
  useOptionalQueryCaller as DuseOptionalQueryCaller,
  useOptionalSyncQueryCaller as DuseOptionalSyncQueryCaller,
  useQueryCaller as DuseQueryCaller,
  useQueryHandler as DuseQueryHandler,
  useSignal as DuseSignal,
  useSignals as DuseSignals,
  useSignalEmitter as DuseSignalEmitter,
  useSignalHandler as DuseSignalHandler,
  useSyncQueryCaller as DuseSyncQueryCaller,
  when as Dwhen,
} from "./development";
import {
  Action as PAction,
  Computed as PComputed,
  Container as PContainer,
  ContainerModule as PContainerModule,
  DeepObservable as PDeepObservable,
  INITIAL_STATE as PINITIAL_STATE,
  Inject as PInject,
  Injectable as PInjectable,
  IocProvider as PIocProvider,
  MultiInject as PMultiInject,
  Named as PNamed,
  Observable as PObservable,
  OnQuery as POnQuery,
  OnSignal as POnSignal,
  Optional as POptional,
  PostConstruct as PPostConstruct,
  PreDestroy as PPreDestroy,
  RefObservable as PRefObservable,
  ShallowObservable as PShallowObservable,
  Tagged as PTagged,
  AbstractService as PAbstractService,
  autorun as Pautorun,
  bindConstant as PbindConstant,
  bindEntry as PbindEntry,
  bindService as PbindService,
  comparer as Pcomparer,
  configure as Pconfigure,
  createIocContainer as PcreateIocContainer,
  createInjectablesProvider as PcreateInjectablesProvider,
  emitSignal as PemitSignal,
  flow as Pflow,
  flowResult as PflowResult,
  forwardRef as PforwardRef,
  isAction as PisAction,
  isFlow as PisFlow,
  isFlowCancellationError as PisFlowCancellationError,
  isObservable as PisObservable,
  makeAutoObservable as PmakeAutoObservable,
  makeObservable as PmakeObservable,
  observer as Pobserver,
  query as Pquery,
  queryOptional as PqueryOptional,
  reaction as Preaction,
  runInAction as PrunInAction,
  toJS as PtoJS,
  useContainer as PuseContainer,
  useContainerRevision as PuseContainerRevision,
  useInjection as PuseInjection,
  useOptionalInjection as PuseOptionalInjection,
  useOptionalQueryCaller as PuseOptionalQueryCaller,
  useOptionalSyncQueryCaller as PuseOptionalSyncQueryCaller,
  useQueryCaller as PuseQueryCaller,
  useQueryHandler as PuseQueryHandler,
  useSignal as PuseSignal,
  useSignals as PuseSignals,
  useSignalEmitter as PuseSignalEmitter,
  useSignalHandler as PuseSignalHandler,
  useSyncQueryCaller as PuseSyncQueryCaller,
  when as Pwhen,
} from "./production";

export const Action = process.env.NODE_ENV === "production" ? PAction : DAction;
export const Computed = process.env.NODE_ENV === "production" ? PComputed : DComputed;
export const Container = process.env.NODE_ENV === "production" ? PContainer : DContainer;
export const ContainerModule = process.env.NODE_ENV === "production" ? PContainerModule : DContainerModule;
export const DeepObservable = process.env.NODE_ENV === "production" ? PDeepObservable : DDeepObservable;
export const INITIAL_STATE = process.env.NODE_ENV === "production" ? PINITIAL_STATE : DINITIAL_STATE;
export const Inject = process.env.NODE_ENV === "production" ? PInject : DInject;
export const Injectable = process.env.NODE_ENV === "production" ? PInjectable : DInjectable;
export const IocProvider = process.env.NODE_ENV === "production" ? PIocProvider : DIocProvider;
export const MultiInject = process.env.NODE_ENV === "production" ? PMultiInject : DMultiInject;
export const Named = process.env.NODE_ENV === "production" ? PNamed : DNamed;
export const Observable = process.env.NODE_ENV === "production" ? PObservable : DObservable;
export const OnQuery = process.env.NODE_ENV === "production" ? POnQuery : DOnQuery;
export const OnSignal = process.env.NODE_ENV === "production" ? POnSignal : DOnSignal;
export const Optional = process.env.NODE_ENV === "production" ? POptional : DOptional;
export const PostConstruct = process.env.NODE_ENV === "production" ? PPostConstruct : DPostConstruct;
export const PreDestroy = process.env.NODE_ENV === "production" ? PPreDestroy : DPreDestroy;
export const RefObservable = process.env.NODE_ENV === "production" ? PRefObservable : DRefObservable;
export const ShallowObservable = process.env.NODE_ENV === "production" ? PShallowObservable : DShallowObservable;
export const Tagged = process.env.NODE_ENV === "production" ? PTagged : DTagged;
export const AbstractService = process.env.NODE_ENV === "production" ? PAbstractService : DAbstractService;
export const autorun = process.env.NODE_ENV === "production" ? Pautorun : Dautorun;
export const bindConstant = process.env.NODE_ENV === "production" ? PbindConstant : DbindConstant;
export const bindEntry = process.env.NODE_ENV === "production" ? PbindEntry : DbindEntry;
export const bindService = process.env.NODE_ENV === "production" ? PbindService : DbindService;
export const comparer = process.env.NODE_ENV === "production" ? Pcomparer : Dcomparer;
export const configure = process.env.NODE_ENV === "production" ? Pconfigure : Dconfigure;
export const createIocContainer = process.env.NODE_ENV === "production" ? PcreateIocContainer : DcreateIocContainer;
export const createInjectablesProvider =
  process.env.NODE_ENV === "production" ? PcreateInjectablesProvider : DcreateInjectablesProvider;
export const emitSignal = process.env.NODE_ENV === "production" ? PemitSignal : DemitSignal;
export const flow = process.env.NODE_ENV === "production" ? Pflow : Dflow;
export const flowResult = process.env.NODE_ENV === "production" ? PflowResult : DflowResult;
export const forwardRef = process.env.NODE_ENV === "production" ? PforwardRef : DforwardRef;
export const isAction = process.env.NODE_ENV === "production" ? PisAction : DisAction;
export const isFlow = process.env.NODE_ENV === "production" ? PisFlow : DisFlow;
export const isFlowCancellationError =
  process.env.NODE_ENV === "production" ? PisFlowCancellationError : DisFlowCancellationError;
export const isObservable = process.env.NODE_ENV === "production" ? PisObservable : DisObservable;
export const makeAutoObservable = process.env.NODE_ENV === "production" ? PmakeAutoObservable : DmakeAutoObservable;
export const makeObservable = process.env.NODE_ENV === "production" ? PmakeObservable : DmakeObservable;
export const observer = process.env.NODE_ENV === "production" ? Pobserver : Dobserver;
export const query = process.env.NODE_ENV === "production" ? Pquery : Dquery;
export const queryOptional = process.env.NODE_ENV === "production" ? PqueryOptional : DqueryOptional;
export const reaction = process.env.NODE_ENV === "production" ? Preaction : Dreaction;
export const runInAction = process.env.NODE_ENV === "production" ? PrunInAction : DrunInAction;
export const toJS = process.env.NODE_ENV === "production" ? PtoJS : DtoJS;
export const useContainer = process.env.NODE_ENV === "production" ? PuseContainer : DuseContainer;
export const useContainerRevision =
  process.env.NODE_ENV === "production" ? PuseContainerRevision : DuseContainerRevision;
export const useInjection = process.env.NODE_ENV === "production" ? PuseInjection : DuseInjection;
export const useOptionalInjection =
  process.env.NODE_ENV === "production" ? PuseOptionalInjection : DuseOptionalInjection;
export const useOptionalQueryCaller =
  process.env.NODE_ENV === "production" ? PuseOptionalQueryCaller : DuseOptionalQueryCaller;
export const useOptionalSyncQueryCaller =
  process.env.NODE_ENV === "production" ? PuseOptionalSyncQueryCaller : DuseOptionalSyncQueryCaller;
export const useQueryCaller = process.env.NODE_ENV === "production" ? PuseQueryCaller : DuseQueryCaller;
export const useQueryHandler = process.env.NODE_ENV === "production" ? PuseQueryHandler : DuseQueryHandler;
export const useSignal = process.env.NODE_ENV === "production" ? PuseSignal : DuseSignal;
export const useSignals = process.env.NODE_ENV === "production" ? PuseSignals : DuseSignals;
export const useSignalEmitter = process.env.NODE_ENV === "production" ? PuseSignalEmitter : DuseSignalEmitter;
export const useSignalHandler = process.env.NODE_ENV === "production" ? PuseSignalHandler : DuseSignalHandler;
export const useSyncQueryCaller = process.env.NODE_ENV === "production" ? PuseSyncQueryCaller : DuseSyncQueryCaller;
export const when = process.env.NODE_ENV === "production" ? Pwhen : Dwhen;
