import { ServiceIdentifier, bindingTypeValues, bindingScopeValues, Container as Container$1, Newable } from 'inversify';
export { bindingTypeValues as BindingType, Container, ContainerModule, inject as Inject, injectable as Injectable, LazyServiceIdentifier, multiInject as MultiInject, named as Named, optional as Optional, postConstruct as PostConstruct, preDestroy as PreDestroy, bindingScopeValues as ScopeBindingType, ServiceIdentifier, tagged as Tagged } from 'inversify';
import * as react from 'react';
import { ReactNode, ReactElement, Dispatch, SetStateAction, PropsWithChildren } from 'react';

declare function forwardRef<TInstance = unknown>(forward: () => ServiceIdentifier<TInstance>): any;

type TBindingType = (typeof bindingTypeValues)[keyof typeof bindingTypeValues];
type TScopeBindingType = (typeof bindingScopeValues)[keyof typeof bindingScopeValues];
interface IInjectableDescriptor<T = unknown, V = unknown> {
    id: ServiceIdentifier<T>;
    value?: V;
    bindingType?: TBindingType;
    scopeBindingType?: TScopeBindingType;
    /**
     * Factory function for dynamic value bindings.
     * Used when type is set to DynamicValue.
     */
    factory?: () => T;
}

/**
 * Binds a single service entry to the container, dispatching to the
 * correct binding strategy based on the descriptor's `type` field.
 *
 * Supports:
 * - Service classes (function entries) - bound as singleton
 * - Constant values - bound via `bindConstant`
 * - Dynamic values - bound via `toDynamicValue` with optional scope
 * - Instance bindings - bound as generic singleton service
 *
 * @param container - target IOC container to bind into
 * @param entry - entry descriptor to bind
 * @returns void
 */
declare function bindEntry<T extends object = object>(container: Container$1, entry: Newable<T> | IInjectableDescriptor): void;

/**
 * Binds a constant value to a token in the container.
 *
 * @param container - target Inversify container
 * @param entry - entry descriptor to bind
 */
declare function bindConstant<T>(container: Container$1, entry: IInjectableDescriptor): void;

type TAnyObject = Record<string, any>;
type Optional<T> = T | null;
type MaybePromise<T> = T | Promise<T>;

/**
 * Command identifier. Use symbols for private commands.
 */
type TCommandType = string | symbol;
/**
 * Command handler signature.
 */
type TCommandHandler<D = unknown, R = unknown> = (data: D) => MaybePromise<R>;
/**
 * Command calling function signature.
 */
type TCommandCaller<R = unknown, D = unknown, T extends TCommandType = TCommandType> = (type: T, data?: D) => ICommandDescriptor<R>;
/**
 * Removes a command handler.
 */
type TCommandUnregister = () => void;
/**
 * Command execution status.
 */
declare enum ECommandStatus {
    PENDING = "pending",
    SETTLED = "settled",
    ERROR = "error"
}
/**
 * Descriptor returned by command execution.
 * Contains the task promise, current status, and responder with result/error.
 */
interface ICommandDescriptor<R = unknown> {
    readonly task: Promise<R>;
    readonly status: ECommandStatus;
}

/**
 * Event identifier.
 */
type TEventType = string | symbol;
/**
 * Event object.
 */
interface IEvent<P = unknown, T extends TEventType = TEventType, F = unknown> {
    readonly type: T;
    readonly payload?: P;
    readonly from?: F;
}
/**
 * Event handler signature.
 */
type TEventHandler<E extends IEvent = IEvent> = (event: E) => void;
/**
 * Unsubscribes from events, part of events subscription lifecycle.
 */
type TEventUnsubscriber = () => void;
/**
 * Event emitter signature.
 */
type TEventEmitter<P = unknown, T extends TEventType = TEventType, F = unknown> = (type: T, payload?: P, from?: F) => void;

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

interface IBindServiceOptions {
    isWithIgnoreLifecycle?: boolean;
}
/**
 * Registers a service class in the container with activation/deactivation logic.
 * Ensures container references, event subscriptions, command and query handlers are managed correctly.
 *
 * @param container - target Inversify container
 * @param entry - service constructor
 * @param options - options object to control binding flow
 */
declare function bindService<T extends object>(container: Container$1, entry: Newable<T>, options?: IBindServiceOptions): void;

interface ICreateIocContainerOptions {
    /**
     * Parent container for inheritance.
     */
    readonly parent?: Container$1;
}
/**
 * Creates an IoC container with framework essentials.
 *
 * @param options - container configuration
 * @returns new IoC container
 */
declare function createIocContainer(options?: ICreateIocContainerOptions): Container$1;

/**
 * Dispatches a command on the provided container.
 *
 * @param container - inversify container
 * @param type - command type
 * @param data - command data
 * @returns command descriptor
 */
declare function command<R = unknown, D = unknown, T extends TCommandType = TCommandType>(container: Container$1, type: T, data?: D): ICommandDescriptor<R>;

/**
 * Dispatches a command on the provided container, returning null if no handler is registered.
 *
 * @param container - inversify container
 * @param type - command type
 * @param data - command data
 * @returns command descriptor or null
 */
declare function commandOptional<R = unknown, D = unknown, T extends TCommandType = TCommandType>(container: Container$1, type: T, data?: D): Optional<ICommandDescriptor<R>>;

/**
 * Emits events for container from outside scope.
 *
 * @param container - inversify container
 * @param type - event type ot emit
 * @param payload - event payload
 * @param from - optional indicator of the event source
 */
declare function emitEvent<P, T extends TEventType>(container: Container$1, type: T, payload?: P, from?: unknown): void;

/**
 * Dispatches a query on the provided container.
 *
 * @param container - inversify container
 * @param type - query type
 * @param data - query data
 * @returns query result
 */
declare function query<R = unknown, D = unknown>(container: Container$1, type: TQueryType, data?: D): MaybePromise<R>;

/**
 * Dispatches a query on the provided container, returning null if no handler is registered.
 *
 * @param container - inversify container
 * @param type - query type
 * @param data - query data
 * @returns query result or null
 */
declare function queryOptional<R = unknown, D = unknown>(container: Container$1, type: TQueryType, data?: D): MaybePromise<R> | null;

/**
 * A custom error class that contains generic error information for Wirestate-related issues.
 *
 * This class extends the native `Error` class and is used to represent errors specific
 * to the Wirestate library, providing more structured error handling.
 */
declare class WirestateError extends Error {
    /**
     * Name or error class to help differentiate error class in minified environments.
     */
    readonly name: string;
    /**
     * Error code describing the issue.
     */
    readonly code: number;
    /**
     * Error message describing the issue.
     */
    readonly message: string;
    constructor(code?: number, detail?: string);
}

/**
 * Lookup key for service seeds.
 */
type TSeedKey = Newable | string | symbol;
/**
 * Service-to-seed mapping entry.
 */
type TSeedEntry<T = unknown> = readonly [TSeedKey, T];
/**
 * Collection of seed entries.
 */
type TSeedEntries = ReadonlyArray<TSeedEntry>;

/**
 * Props for the component returned by {@link createInjectablesProvider}.
 */
interface IInjectablesProviderProps {
    /**
     * Targeted seeds bound to specific injectables or tokens.
     * Subsequent prop changes are ignored. Use a React `key` to re-seed the tree.
     */
    readonly seeds?: TSeedEntries;
    /**
     * Subtree that consumes the bound services.
     */
    readonly children?: ReactNode;
}
/**
 * Component returned by {@link createInjectablesProvider}.
 */
type InjectablesProvider = ReturnType<typeof createInjectablesProvider>;
/**
 * Configuration for {@link createInjectablesProvider}.
 */
interface ICreateInjectablesProviderOptions {
    /**
     * Services to resolve immediately on mount.
     */
    readonly activate?: ReadonlyArray<ServiceIdentifier>;
}
/**
 * Creates a component that manages injectable lifetimes for its subtree.
 *
 * @param entries - service classes or injectable descriptors to bind
 * @param options - provider configuration
 * @returns injectables provider component
 */
declare function createInjectablesProvider(entries: ReadonlyArray<Newable<object> | IInjectableDescriptor>, options?: ICreateInjectablesProviderOptions): {
    (props: IInjectablesProviderProps): ReactElement;
    displayName: string;
};

/**
 * React context value.
 */
interface IIocContext {
    /**
     * Inversify container.
     */
    readonly container: Container$1;
    /**
     * Revision counter for cache invalidation.
     */
    readonly revision: number;
    /**
     * Forces a revision update.
     */
    readonly setRevision: Dispatch<SetStateAction<number>>;
}

/**
 * Props for {@link IocProvider}.
 */
interface IIocProviderProps extends PropsWithChildren<unknown> {
    /**
     * External container instance. If omitted, a new container is created.
     */
    readonly container?: Container$1;
    /**
     * Shared seed for the container.
     */
    readonly seed?: TAnyObject;
}
/**
 * Provides an IoC container to the component tree.
 *
 * @param props - component props
 * @param props.container - external container instance
 * @param props.seed - shared seed across the container
 * @param props.children - components to wrap
 * @returns provider element
 */
declare function IocProvider({ container: externalContainer, seed, children }: IIocProviderProps): react.FunctionComponentElement<react.ProviderProps<Optional<IIocContext>>>;

/**
 * Returns the active IoC container.
 *
 * @returns active Inversify container
 */
declare function useContainer(): Container$1;

/**
 * Returns the current container revision.
 *
 * @returns revision number
 */
declare function useContainerRevision(): number;

/**
 * Decorator for service methods that handle a command.
 *
 * @param type - command type identifier
 * @returns decorator function
 */
declare function OnCommand(type: TCommandType): MethodDecorator;

/**
 * Returns a function to dispatch commands on the active container.
 *
 * @returns command dispatcher
 */
declare function useCommandCaller(): <R = unknown, D = unknown, T extends TCommandType = TCommandType>(type: T, data?: D) => ICommandDescriptor<R>;

/**
 * Returns a function to dispatch optional commands on the active container.
 * Returns null instead of throwing when no handler is registered.
 *
 * @returns optional command dispatcher
 */
declare function useOptionalCommandCaller(): <R = unknown, D = unknown, T extends TCommandType = TCommandType>(type: T, data?: D) => Optional<ICommandDescriptor<R>>;

/**
 * Registers a command handler for the component's lifetime.
 * The handler is stored in a ref to avoid manual memoization.
 * Only one handler is active per type; newer registrations shadow older ones.
 *
 * @param type - command type
 * @param handler - command handler function
 */
declare function useCommandHandler<R = unknown, D = unknown>(type: TCommandType, handler: TCommandHandler<D, R>): void;

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
 * Returns a function to dispatch optional queries on the active container.
 * Returns null instead of throwing when no handler is registered.
 *
 * @returns optional query dispatcher
 */
declare function useOptionalQueryCaller(): <R = unknown, D = unknown>(type: TQueryType, data?: D) => Optional<MaybePromise<R>>;

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
 * Returns a stable function to dispatch synchronous optional queries.
 * Returns null instead of throwing when no handler is registered.
 *
 * @returns optional sync query dispatcher
 */
declare function useOptionalSyncQueryCaller(): <R = unknown, D = unknown>(type: TQueryType, data?: D) => Optional<R>;

/**
 * Injectable scope providing access to wirestate buses and seeds.
 * Each injecting service receives its own instance (transient scope).
 * The scope is activated and deactivated automatically alongside its owner service.
 */
declare class WireScope {
    private readonly container;
    /**
     * Whether the scope was deactivated and disposed from the container.
     */
    readonly isDisposed: boolean;
    constructor(container: Optional<Container$1>);
    /**
     * Access the IoC container.
     * Available only for activated instances of scope.
     *
     * @returns active container
     *
     * @throws WirestateError if scope is not activated or already disposed
     */
    getContainer(): Container$1;
    /**
     * Resolves a sibling service or injected value.
     * Use for lazy resolution or circular dependency breaking.
     * Available only for activated containers.
     *
     * @param injectionId - injection identifier
     * @returns resolved injection, service instance, or generic value
     *
     * @throws WirestateError if scope is not activated
     */
    resolve<T>(injectionId: ServiceIdentifier<T>): T;
    /**
     * Broadcasts an event.
     * Available only for activated containers.
     *
     * @param type - type of event to emit
     * @param payload - optional payload to send with the event
     * @param from - optional sender of the event
     *
     * @throws WirestateError if scope is not activated
     */
    emitEvent<P, T extends TEventType = TEventType>(type: T, payload?: P, from?: unknown): void;
    /**
     * Dispatches a query and returns the result.
     * Available only for activated containers.
     *
     * @param type - query type
     * @param data - query data
     * @returns query result
     *
     * @throws WirestateError if scope is not activated
     */
    queryData<R = unknown, D = unknown, T extends TQueryType = TQueryType>(type: T, data?: D): MaybePromise<R>;
    /**
     * Dispatches a command and returns the descriptor.
     * Available only for activated containers.
     *
     * @param type - command type
     * @param data - command data
     * @returns command descriptor
     *
     * @throws WirestateError if scope is not activated
     */
    executeCommand<R = unknown, D = unknown, T extends TCommandType = TCommandType>(type: T, data?: D): ICommandDescriptor<R>;
    getSeed<T>(): T;
    getSeed<T>(seed?: TSeedKey): T;
}

/**
 * Token for the container-scoped shared seed object.
 */
declare const SEED_TOKEN: unique symbol;

/**
 * Decorator for service methods that run after activation.
 *
 * @returns decorator function
 */
declare function OnActivated(): MethodDecorator;

/**
 * Decorator for service methods that run before deactivation.
 *
 * @returns decorator function
 */
declare function OnDeactivation(): MethodDecorator;

/**
 * Resolves a value from the container - constant or service.
 * Automatically re-resolves if the container is reset or services are rebound.
 *
 * @param injectionId - injection identifier
 * @returns resolved value
 */
declare function useInjection<T>(injectionId: ServiceIdentifier<T>): T;

/**
 * Resolves a value from the container if bound, returning null otherwise.
 * Unlike {@link useInjection}, this hook does not throw when the token is not bound.
 *
 * @param injectionId - injection identifier
 * @returns resolved value or null
 */
declare function useOptionalInjection<T>(injectionId: ServiceIdentifier<T>): Optional<T>;

/**
 * Decorator for service methods that respond to events.
 *
 * @param types - event type(s) to handle. If omitted, handles all events
 * @returns decorator function
 */
declare function OnEvent(types?: TEventType | ReadonlyArray<TEventType>): MethodDecorator;

/**
 * Subscribes a component to events.
 *
 * @param type - event type to listen to
 * @param handler - event handler to invoke when event is emitted
 */
declare function useEvent(type: TEventType, handler: TEventHandler): void;

/**
 * Subscribes a component to multiple event types.
 *
 * @param types - event types to filter by
 * @param handler - events handler
 */
declare function useEvents(types: ReadonlyArray<TEventType>, handler: TEventHandler): void;

/**
 * Subscribes a component to all events without type filtering.
 *
 * @param handler - event handler invoked for every emitted event
 */
declare function useEventsHandler(handler: TEventHandler): void;

/**
 * Returns a stable function to emit events.
 *
 * @returns event emitter
 */
declare function useEventEmitter<P = unknown, T extends TEventType = TEventType>(): TEventEmitter<P, T>;

interface IMockBindServiceOptions {
    skipLifecycle?: boolean;
}
declare function mockBindService<T extends object>(container: Container$1, ServiceClass: Newable<T>, options?: IMockBindServiceOptions): void;

interface IMockContainerOptions {
    services?: Array<Newable<object>>;
    activate?: Array<ServiceIdentifier>;
    skipLifecycle?: boolean;
}
declare function mockContainer(options?: IMockContainerOptions): Container$1;

interface IMockServiceOptions {
    skipLifecycle?: boolean;
}
declare function mockService<T extends object>(service: Newable<T>, container?: Container, options?: IMockServiceOptions): T;

/**
 * Wraps a component with IocProvider for testing.
 *
 * @param children - components to wrap
 * @param container - optional custom container
 * @param seed - optional shared seed object
 * @returns wrapped components
 */
declare function withIocProvider(children: ReactNode, container?: Container$1, seed?: TAnyObject): react.FunctionComponentElement<{
    container: Container$1;
    seed: TAnyObject | undefined;
}>;

export { ECommandStatus as CommandStatus, IocProvider, OnActivated, OnCommand, OnDeactivation, OnEvent, OnQuery, SEED_TOKEN as SEED, WireScope, WirestateError, bindConstant, bindEntry, bindService, command, commandOptional, createInjectablesProvider, createIocContainer, emitEvent, forwardRef, mockBindService, mockContainer, mockService, query, queryOptional, useCommandCaller, useCommandHandler, useContainer, useContainerRevision, useEvent, useEventEmitter, useEvents, useEventsHandler, useInjection, useOptionalCommandCaller, useOptionalInjection, useOptionalQueryCaller, useOptionalSyncQueryCaller, useQueryCaller, useQueryHandler, useSyncQueryCaller, withIocProvider };
export type { TCommandCaller as CommandCaller, ICommandDescriptor as CommandDescriptor, TCommandHandler as CommandHandler, TCommandType as CommandType, TCommandUnregister as CommandUnregister, IEvent as Event, TEventEmitter as EventEmitter, TEventHandler as EventHandler, TEventType as EventType, TEventUnsubscriber as EventUnsubscriber, IInjectableDescriptor as InjectableDescriptor, InjectablesProvider, IInjectablesProviderProps as InjectablesProviderProps, TQueryHandler as QueryHandler, TQueryResponder as QueryResponder, TQueryType as QueryType, TQueryUnregister as QueryUnregister, TSeedEntries as SeedEntries, TSeedEntry as SeedEntry, TSeedKey as SeedKey };
