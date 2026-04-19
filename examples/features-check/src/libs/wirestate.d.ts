import * as mobx_dist_types_decorator_fills from 'mobx/dist/types/decorator_fills';
import * as mobx_dist_internal from 'mobx/dist/internal';
import * as mobx from 'mobx';
export { autorun, flow, flowResult, isFlow, isFlowCancellationError, makeAutoObservable, makeObservable, runInAction } from 'mobx';
import { ServiceIdentifier, Newable, Container } from 'inversify';
export { Container, inject as Inject, injectable as Injectable, ServiceIdentifier } from 'inversify';
import { ReactNode, FC } from 'react';
export { observer } from 'mobx-react-lite';

declare function Observable(): mobx.IObservableFactory;
declare function ShallowObservable(): mobx_dist_internal.Annotation & PropertyDecorator & mobx_dist_types_decorator_fills.ClassAccessorDecorator & mobx_dist_types_decorator_fills.ClassFieldDecorator;
declare function RefObservable(): mobx_dist_internal.Annotation & PropertyDecorator & mobx_dist_types_decorator_fills.ClassAccessorDecorator & mobx_dist_types_decorator_fills.ClassFieldDecorator;
declare function DeepObservable(): mobx_dist_internal.Annotation & PropertyDecorator & mobx_dist_types_decorator_fills.ClassAccessorDecorator & mobx_dist_types_decorator_fills.ClassFieldDecorator;
declare function Action(): mobx.IActionFactory;
declare function Computed(): mobx.IComputedFactory;
declare function forwardRef<TInstance = unknown>(forward: () => ServiceIdentifier<TInstance>): any;

/**
 * Service constructor.
 */
type TServiceClass<T extends AbstractService = AbstractService> = Newable<T>;

/**
 * Lookup key for service seeds.
 */
type TInitialStateKey = TServiceClass | string | symbol;
/**
 * Service-to-seed mapping entry.
 */
type TInitialStateEntry<T = unknown> = readonly [TInitialStateKey, T];
/**
 * Collection of seed entries.
 */
type TInitialStateEntries = ReadonlyArray<TInitialStateEntry>;

/**
 * Query identifier. Use symbols for private queries.
 */
type TQueryType = string | symbol;
/**
 * Query handler signature.
 */
type TQueryHandler<D = unknown, R = unknown> = (data: D) => R | Promise<R>;
/**
 * Removes a query handler.
 */
type TQueryUnregister = () => void;
/**
 * Public query responder signature.
 */
type TQueryResponder<R = unknown, D = unknown> = (data?: D) => R | Promise<R>;

/**
 * Signal identifier. Use symbols for private signals.
 */
type TSignalType = string | symbol;
/**
 * Signal object.
 */
interface ISignal<P = unknown, T extends TSignalType = TSignalType> {
    readonly type: T;
    readonly payload?: P;
}
/**
 * Signal handler signature.
 */
type TSignalHandler<S extends ISignal = ISignal> = (signal: S) => void;
/**
 * Unsubscribes from signals.
 */
type TSignalUnsubscribe = () => void;
/**
 * Signal emitter signature.
 */
type TSignalEmitter = (signal: ISignal) => void;

/**
 * Base class for services.
 */
declare abstract class AbstractService {
    /**
     * Disposal flag.
     * Check in async actions to avoid updating unmounted services.
     */
    readonly IS_DISPOSED: boolean;
    /**
     * Access the IoC container.
     * Internal. Use for on-demand resolution.
     *
     * @returns active container
     */
    protected getContainer(): Container;
    /**
     * Resolves a sibling service.
     * Use for lazy resolution or circular dependency breaking.
     *
     * @param serviceId - service identifier
     * @returns resolved service instance
     */
    protected getService<T>(serviceId: ServiceIdentifier<T>): T;
    /**
     * Broadcasts a signal.
     *
     * @param signal - signal to emit
     */
    protected emitSignal<P, T extends TSignalType = TSignalType>(signal: ISignal<P, T>): void;
    /**
     * Dispatches a query and returns the result.
     *
     * @param type - query type
     * @param data - query data
     * @returns query result
     */
    protected queryData<R = unknown, D = unknown, T extends TQueryType = TQueryType>(type: T, data?: D): R | Promise<R>;
    protected getInitialState<T>(): T;
    protected getInitialState<T>(ServiceClass?: TInitialStateKey): T | null;
    /**
     * Lifecycle hook: runs after activation.
     * Override for initialization.
     */
    onActivated(): void | Promise<void>;
    /**
     * Lifecycle hook: runs before deactivation.
     * Override for cleanup.
     */
    onDeactivated(): void | Promise<void>;
    /**
     * Catch-all signal handler.
     * Subscribed automatically during service lifecycle.
     */
    onSignal?(signal: ISignal): void;
}

/**
 * Registers an AbstractService in the container with activation/deactivation logic.
 * Ensures container references, signal subscriptions, and query handlers are managed correctly.
 *
 * @param container - target Inversify container
 * @param token - service identifier
 * @param ServiceClass - service constructor
 * @param isOnceBind - if true, skips binding if the token is already bound
 * @param isIgnoreLifecycle - if true, skips lifecycle hooks (activation, deactivation)
 */
declare function bindService<T extends AbstractService>(container: Container, token: ServiceIdentifier<T>, ServiceClass: Newable<T>, isOnceBind?: boolean, isIgnoreLifecycle?: boolean): void;

interface ICreateIocContainerOptions {
    /**
     * Parent container for inheritance.
     */
    readonly parent?: Container;
}
/**
 * Creates an IoC container with framework essentials.
 *
 * @param options - container configuration
 * @returns new IoC container
 */
declare function createIocContainer(options?: ICreateIocContainerOptions): Container;

/**
 * Emits signals from outside an AbstractService.
 *
 * @param container - inversify container
 * @param signal - signal to emit
 */
declare function emitSignal<P>(container: Container, signal: ISignal<P>): void;

/**
 * Dispatches a query on the provided container.
 *
 * @param container - inversify container
 * @param type - query type
 * @param data - query data
 * @returns query result
 */
declare function query<R = unknown, D = unknown>(container: Container, type: TQueryType, data?: D): R | Promise<R>;

type TAnyObject = Record<string, any>;

/**
 * Binds or rebinds an {@link InitialState} to the container.
 *
 * @param container - target container
 * @param shared - shared state object
 * @param bound - targeted state entries
 */
declare function applyInitialState(container: Container, shared?: TAnyObject, bound?: TInitialStateEntries): void;

/**
 * Container-scoped storage for service seeds.
 */
declare class InitialState {
    /**
     * Internal states storage.
     */
    private readonly boundStates;
    private readonly sharedState;
    constructor(shared?: TAnyObject, bound?: TInitialStateEntries);
    /**
     * Returns the shared state.
     *
     * @returns shared initial state for all services
     */
    getShared<T extends TAnyObject>(): T;
    /**
     * Returns the seed for the given service.
     *
     * @param ServiceClass - service constructor
     * @returns initial state data or null if missing
     */
    getFor<T extends TAnyObject>(ServiceClass: TInitialStateKey): T | null;
    /**
     * Checks if a seed exists for the given service.
     *
     * @param ServiceClass - service constructor
     * @returns true if seed exists
     */
    hasFor(ServiceClass: TInitialStateKey): boolean;
}

/**
 * Props for the component returned by {@link createServicesProvider}.
 */
interface IServicesProviderProps {
    /**
     * Shared initial state applied to services on first mount.
     */
    readonly initialState?: TAnyObject;
    /**
     * Initial state applied to services on first mount.
     * Subsequent prop changes are ignored. Use a React `key` to re-seed the tree.
     */
    readonly initialStates?: TInitialStateEntries;
    /**
     * Subtree that consumes the bound services.
     */
    readonly children?: ReactNode;
}
/**
 * Component returned by {@link createServicesProvider}.
 */
type ServicesProvider = ReturnType<typeof createServicesProvider>;
/**
 * Configuration for {@link createServicesProvider}.
 */
interface ICreateIocProviderOptions {
    /**
     * Services to resolve immediately on mount.
     */
    readonly activate?: ReadonlyArray<TServiceClass>;
}
/**
 * Creates a component that manages service lifetimes for its subtree.
 *
 * @param services - service classes to bind
 * @param options - provider configuration
 * @returns service provider component
 */
declare function createServicesProvider(services: ReadonlyArray<TServiceClass>, options?: ICreateIocProviderOptions): {
    (props: IServicesProviderProps): ReactNode;
    displayName: string;
};

/**
 * Props for {@link IocProvider}.
 */
interface IIocProviderProps {
    /**
     * External container instance. If omitted, a new container is created.
     */
    readonly container?: Container;
    /**
     * Components to wrap.
     */
    readonly children: ReactNode;
}
/**
 * Provides an IoC container to the component tree.
 *
 * @param props - component props
 * @param props.container - external container instance
 * @param props.children - components to wrap
 * @returns provider element
 */
declare const IocProvider: FC<IIocProviderProps>;

/**
 * Returns the active IoC container.
 *
 * @returns active Inversify container
 */
declare function useContainer(): Container;

/**
 * Returns the current container revision.
 *
 * @returns revision number
 */
declare function useContainerRevision(): number;

/**
 * Decorator for service methods that respond to a query.
 *
 * @param type - query type identifier
 * @returns decorator function
 */
declare function OnQuery(type: TQueryType): MethodDecorator;

/**
 * Returns a function to dispatch queries on the active container.
 *
 * @returns query dispatcher
 */
declare function useQueryCaller(): <R = unknown, D = unknown>(type: TQueryType, data?: D) => any;

/**
 * Registers a query handler for the component's lifetime.
 * The handler is stored in a ref to avoid manual memoization.
 * Only one handler is active per type; newer registrations shadow older ones.
 *
 * @param type - query type
 * @param handler - query handler function
 */
declare function useQueryHandler<RetType = unknown, D = unknown>(type: TQueryType, handler: TQueryHandler<D, RetType>): void;

/**
 * Returns a stable function to dispatch synchronous queries.
 * Returns the value directly from the handler.
 *
 * @returns sync query dispatcher
 */
declare function useSyncQueryCaller(): <R = unknown, D = unknown>(type: TQueryType, data?: D) => R;

/**
 * Token for the container-scoped shared initial-state object.
 */
declare const INITIAL_STATE_SHARED_TOKEN: unique symbol;

/**
 * Resolves a service instance from the container.
 * Automatically re-resolves if the container is reset or services are rebound.
 *
 * @param token - service identifier
 * @returns resolved service instance
 */
declare function useService<T>(token: ServiceIdentifier<T>): T;

/**
 * Decorator for service methods that respond to signals.
 *
 * @param types - signal type(s) to handle. If omitted, handles all signals
 * @returns decorator function
 */
declare function OnSignal(types?: TSignalType | ReadonlyArray<TSignalType>): MethodDecorator;

declare function useSignal(handler: TSignalHandler): void;
declare function useSignal(type: TSignalType | ReadonlyArray<TSignalType>, handler: TSignalHandler): void;

/**
 * Returns a stable function to emit signals.
 *
 * @returns signal emitter
 */
declare function useSignalEmitter(): TSignalEmitter;

declare function mockBindService<T extends AbstractService>(container: Container, ServiceClass: Newable<T>, token?: ServiceIdentifier<T>): void;

declare function mockContainer(): Container;

export { AbstractService, Action, Computed, DeepObservable, INITIAL_STATE_SHARED_TOKEN as INITIAL_STATE, InitialState, IocProvider, Observable, OnQuery, OnSignal, RefObservable, ShallowObservable, applyInitialState, bindService, createIocContainer, createServicesProvider, emitSignal, forwardRef, mockBindService, mockContainer, query, useContainer, useContainerRevision, useQueryCaller, useQueryHandler, useService, useSignal, useSignalEmitter, useSyncQueryCaller };
export type { TInitialStateEntries as InitialStateEntries, TInitialStateEntry as InitialStateEntry, TInitialStateKey as InitialStateKey, TQueryHandler as QueryHandler, TQueryResponder as QueryResponder, TQueryType as QueryType, TQueryUnregister as QueryUnregister, TServiceClass as ServiceClass, ServicesProvider, IServicesProviderProps as ServicesProviderProps, ISignal as Signal, TSignalEmitter as SignalEmitter, TSignalHandler as SignalHandler, TSignalType as SignalType, TSignalUnsubscribe as SignalUnsubscribe };
