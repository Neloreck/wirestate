import { ServiceIdentifier, LazyServiceIdentifier, bindingTypeValues, bindingScopeValues, Newable, Container as Container$1, BindWhenOnFluentSyntax } from 'inversify';
export { AbstractNewable, Bind, BindInFluentSyntax, BindInWhenOnFluentSyntax, BindOnFluentSyntax, BindToFluentSyntax, BindWhenFluentSyntax, BindWhenOnFluentSyntax, BindingActivation, BindingConstraints, BindingDeactivation, BindingIdentifier, BindingScope, bindingTypeValues as BindingType, BoundServiceSyntax, Container, ContainerModule, ContainerModuleLoadOptions, ContainerOptions, DynamicValueBuilder, Factory, GetAllOptions, GetOptions, GetOptionsTagConstraint, inject as Inject, injectFromBase as InjectFromBase, InjectFromBaseOptions, InjectFromBaseOptionsLifecycle, injectFromHierarchy as InjectFromHierarchy, InjectFromHierarchyOptions, InjectFromHierarchyOptionsLifecycle, injectable as Injectable, IsBound, IsBoundOptions, LazyServiceIdentifier, MapToResolvedValueInjectOptions, MetadataName, MetadataTag, multiInject as MultiInject, MultiInjectOptions, named as Named, Newable, optional as Optional, OptionalGetOptions, postConstruct as PostConstruct, preDestroy as PreDestroy, Rebind, RebindSync, ResolutionContext, ResolvedValueInjectOptions, ResolvedValueMetadataInjectOptions, ResolvedValueMetadataInjectTagOptions, bindingScopeValues as ScopeBindingType, ServiceIdentifier, tagged as Tagged, Unbind, UnbindSync, unmanaged as Unmanaged, bindingScopeValues, bindingTypeValues } from 'inversify';
import * as react from 'react';
import { ReactNode, ReactElement } from 'react';
export { Model, ModelConstructor, ReadonlySignal, Signal, action, batch, computed, createModel, effect, signal, untracked, useComputed, useModel, useSignal, useSignalEffect } from '@preact/signals-react';

/**
 * Util to resolve circular dependencies by wrapping the service identifier in a lazy identifier.
 *
 * @group External-inversify
 * @see {@link https://inversify.io/}
 *
 * @param forward - A function that returns the service identifier.
 * @returns A lazy service identifier.
 */
declare function forwardRef<TInstance = unknown>(forward: () => ServiceIdentifier<TInstance>): LazyServiceIdentifier<TInstance>;

/**
 * Inversify binding strategy types.
 *
 * @group Bind
 */
type BindingType = (typeof bindingTypeValues)[keyof typeof bindingTypeValues];
/**
 * Inversify scope strategy types.
 *
 * @group Bind
 */
type ScopeBindingType = (typeof bindingScopeValues)[keyof typeof bindingScopeValues];
/**
 * Represents descriptor used by wirestate bind/provision APIs to describe how one injectable is resolved.
 *
 * @remarks
 * This interface bridges standard Inversify binding options with Wirestate's simplified registration API.
 * It is used by {@link bindConstant}, {@link bindDynamicValue}, and {@link bindEntry}.
 *
 * @group Bind
 *
 * @template T - Service type resolved from container by {@link id} or returned by {@link factory}.
 * @template V - Value type used by constant/value-style bindings via {@link value}.
 *
 * @example
 * ```typescript
 * const descriptor: InjectableDescriptor<UserRepo> = {
 *   id: UserRepo,
 *   scopeBindingType: "Singleton"
 * };
 * ```
 */
interface InjectableDescriptor<T = unknown, V = unknown> {
    /**
     * Inversify binding strategy.
     *
     * @remarks
     * Example values: `ConstantValue`, `DynamicValue`, `Factory`, `Provider`.
     */
    readonly bindingType?: BindingType;
    /**
     * Factory function used by dynamic value bindings.
     *
     * @remarks
     * Called by the {@link Container} to create a service instance of type T.
     */
    readonly factory?: () => T;
    /**
     * Unique service token used by Inversify to locate the injectable binding.
     *
     * @remarks
     * Accepts class constructor, symbol, or string service identifier.
     */
    readonly id: ServiceIdentifier<T>;
    /**
     * Inversify scope strategy for created instances.
     *
     * @remarks
     * Example values: `Singleton`, `Transient`, `Request`.
     */
    readonly scopeBindingType?: ScopeBindingType;
    /**
     * Prebuilt value for value-based bindings.
     *
     * @remarks
     * Used when binding mode expects a direct value instance (e.g., constant values).
     */
    readonly value?: V;
}
/**
 * Readonly list of entries accepted by Wirestate registration APIs.
 *
 * @remarks
 * Each item can be either a service class constructor (`Newable<object>`) or
 * a fully configured {@link InjectableDescriptor}.
 *
 * @group Bind
 */
type InjectableEntries = ReadonlyArray<Newable<object> | InjectableDescriptor>;

/**
 * Binds a constant value to a service identifier in the container.
 *
 * @remarks
 * Use this to register configuration values, primitive constants, or pre-instantiated objects.
 * Constant values are bound with a singleton scope by default.
 *
 * @group Bind
 *
 * @template T - Type of the service being bound.
 *
 * @param container - Target Inversify {@link Container}.
 * @param entry - Descriptor containing `id` (token) and `value` (constant).
 * @returns Inversify fluent syntax for additional constraints.
 *
 * @throws {@link WirestateError} If `entry.scopeBindingType` is not `Singleton`.
 *
 * @example
 * ```typescript
 * const API_URL: unique symbol = Symbol("API_URL");
 *
 * bindConstant(container, {
 *   id: API_URL,
 *   value: "https://api.example.com"
 * });
 * ```
 */
declare function bindConstant<T>(container: Container$1, entry: InjectableDescriptor): BindWhenOnFluentSyntax<T>;

/**
 * Binds a dynamic value (factory-based) to an identifier in the container.
 *
 * @remarks
 * Use this when the value depends on runtime state or requires logic during resolution.
 * The binding uses `entry.factory` if provided; otherwise, it falls back to `entry.value`.
 * Supports custom scoping via `entry.scopeBindingType`.
 *
 * @group Bind
 *
 * @template T - Type of the value being bound.
 *
 * @param container - Target Inversify {@link Container}.
 * @param entry - Descriptor containing `id`, `factory` or `value`, and optional `scopeBindingType`.
 * @returns Inversify fluent syntax for additional constraints.
 *
 * @example
 * ```typescript
 * const DATE_NOW: unique symbol = Symbol("DATE_NOW");
 *
 * bindDynamicValue(container, {
 *   id: DATE_NOW,
 *   factory: () => new Date()
 * });
 * ```
 */
declare function bindDynamicValue<T>(container: Container$1, entry: InjectableDescriptor): BindWhenOnFluentSyntax<T>;

/**
 * Represents options for {@link bindService}.
 *
 * @group Bind
 */
interface BindServiceOptions {
    /**
     * If true, suppresses execution of `@OnActivated` and `@OnDeactivation` methods.
     * Messaging registrations (commands, queries, events) are still processed.
     *
     * @default false
     */
    readonly isWithIgnoreLifecycle?: boolean;
}
/**
 * Binds a service class in the {@link Container} with full lifecycle and messaging integration.
 *
 * @remarks
 * Binds the class in singleton scope and configures Inversify activation/deactivation hooks to:
 * - Manage the `IS_DISPOSED` lifecycle state flag.
 * - Trigger `@OnActivated` and `@OnDeactivation` decorated methods.
 * - Register/unregister `@OnCommand`, `@OnEvent` and `@OnQuery` handlers.
 * - Set up event dispatching and bus subscriptions.
 * - Track and dispose injected {@link WireScope} instances.
 *
 * @group Bind
 *
 * @template T - Type of the service instance.
 *
 * @param container - Target Inversify {@link Container}.
 * @param entry - Service class constructor.
 * @param options - Configuration options for the binding.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   @OnActivated()
 *   public onActivated(): void {
 *     console.log("UserService activated");
 *   }
 *
 *   @OnDeactivation()
 *   public onDeactivation(): void {
 *     console.log("UserService deactivating");
 *   }
 *
 *   @OnEvent("USER_LOGGED_IN")
 *   private onUserLoggedIn(event: UserLoggedInEvent) {
 *     console.log('User logged in:', event.payload);
 *   }
 *
 *   @OnCommand("LOG_DATE_NOW")
 *   private onLogDateNow(): void {
 *     console.log("Date now:", new Date());
 *   }
 *
 *   @OnQuery("DATE_NOW")
 *   private onQueryDateNow(): void {
 *     return new Date();
 *   }
 * }
 *
 * bindService(container, UserService);
 * ```
 */
declare function bindService<T extends object>(container: Container$1, entry: Newable<T>, options?: BindServiceOptions): void;

/**
 * Represents options for {@link bindEntry}.
 *
 * @group Bind
 */
interface BindEntryOptions extends BindServiceOptions {
    /**
     * If true, the service's lifecycle methods (like `@OnActivated`) will be ignored
     * during the binding process.
     *
     * @default `false`
     */
    readonly isWithIgnoreLifecycle?: boolean;
}
/**
 * Binds an entry to the Inversify {@link Container} using the appropriate strategy.
 *
 * @remarks
 * This is a high-level dispatching function that selects the binding method based on the `entry` type:
 * - **Class Constructor**: Binds as a singleton service via {@link bindService}.
 * - **ConstantValue**: Binds a fixed value via {@link bindConstant}.
 * - **DynamicValue**: Binds a factory-generated value via {@link bindDynamicValue}.
 * - **Instance**: Binds a value as a class instance via {@link bindService}.
 *
 * @group Bind
 *
 * @template T - Type of the object being bound.
 *
 * @param container - Target Inversify {@link Container}.
 * @param entry - Class constructor or {@link InjectableDescriptor} describing the service.
 * @param options - Optional binding configuration (primarily used for class-based services).
 *
 * @throws {@link WirestateError} If `entry.scopeBindingType` is not `Singleton` for constant values.
 *
 * @example
 * ```typescript
 * // Binding a class constructor (defaults to singleton)
 * class MyService {}
 *
 * bindEntry(container, MyService);
 *
 * // Binding a constant value
 * const API_URL: unique symbol = Symbol("API_URL");
 *
 * bindEntry(container, {
 *   id: API_URL,
 *   value: "https://api.example.com"
 * });
 *
 * // Binding a dynamic value (factory)
 * const CURRENT_TIME: unique symbol = Symbol("CURRENT_TIME");
 *
 * bindEntry(container, {
 *   id: CURRENT_TIME,
 *   bindingType: "DynamicValue",
 *   factory: () => new Date()
 * });
 * ```
 */
declare function bindEntry<T extends object = object>(container: Container$1, entry: Newable<T> | InjectableDescriptor, options?: BindEntryOptions): void;

/**
 * Resolves the identifier for a given entry.
 *
 * @remarks
 * Handles both plain service classes and injectable descriptors:
 * - If `entry` is a class constructor, it is returned as the identifier.
 * - If `entry` is an {@link InjectableDescriptor}, its `id` field is returned.
 *
 * @group Bind
 *
 * @template T - Type of the injectable object.
 *
 * @param entry - Class constructor or descriptor to get the identifier for.
 * @returns Identifier token for Inversify.
 *
 * @example
 * ```typescript
 * class MyService {}
 *
 * getEntryToken(MyService); // returns MyService
 *
 * getEntryToken({ id: "my-service" }); // returns "my-service"
 * ```
 */
declare function getEntryToken<T extends object = object>(entry: Newable<T> | InjectableDescriptor): ServiceIdentifier;

/**
 * Generic object with string or symbol keys and any value.
 *
 * @group general-types
 */
type AnyObject = Record<string | symbol, any>;
/**
 * Represents a value that can be null.
 *
 * @template T - The base type.
 * @group general-types
 */
type Optional$1<T> = T | null;
/**
 * Represents a value that can be a T or a Promise resolving to T.
 *
 * @template T - The base type.
 * @group general-types
 */
type MaybePromise$1<T> = T | Promise<T>;

/**
 * Represents identifier used to dispatch and handle commands.
 *
 * @remarks
 * Use strings for public commands and symbols for private/scoped commands to avoid name collisions.
 *
 * @group Commands
 *
 * @example
 * ```typescript
 * const PUBLIC_COMMAND: CommandType = "USER/LOGIN";
 *
 * const PRIVATE_COMMAND: CommandType = Symbol("INTERNAL/SYNC");
 *
 * enum CounterCommand {
 *   INCREMENT = "COUNTER/INCREMENT",
 *   DECREMENT = "COUNTER/DECREMENT",
 * }
 * ```
 */
type CommandType = string | symbol;
/**
 * Represents function signature for handling command execution.
 *
 * @group Commands
 *
 * @template D - Type of the input payload (data) for the command.
 * @template R - Type of the result returned by the handler (can be wrapped in a Promise).
 *
 * @example
 * ```typescript
 * const loginHandler: CommandHandler<Credentials, Session> = (payload) => {
 *   return auth.login(payload);
 * };
 * ```
 */
type CommandHandler<D = unknown, R = unknown> = (payload: D) => MaybePromise$1<R>;
/**
 * Represents function returned when a command handler is registered.
 * Calling this function removes the handler from the command bus.
 *
 * @group Commands
 *
 * @example
 * ```typescript
 * const unregister: CommandUnregister = commandBus.register("MY_COMMAND", handler);
 *
 * unregister();
 * ```
 */
type CommandUnregister = () => void;
/**
 * Represents the current state of a command execution.
 *
 * @group Commands
 */
declare enum CommandStatus {
    /** The command task has started but not yet completed. */
    PENDING = "pending",
    /** The command task has successfully completed. */
    SETTLED = "settled",
    /** The command task failed with an error. */
    ERROR = "error"
}
/**
 * Represents a handle to an executing command.
 *
 * @remarks
 * Returned by the command bus when a command is dispatched. It allows tracking
 * the progress and outcome of the command execution.
 *
 * @group Commands
 *
 * @template R - Type of the result produced by the command.
 */
interface CommandDescriptor<R = unknown> {
    /**
     * A promise that resolves with the command result or rejects with an error.
     */
    readonly task: Promise<R>;
    /**
     * The current execution status of the command.
     */
    readonly status: CommandStatus;
}

/**
 * Dispatches a command through the {@link CommandBus} resolved from the container.
 *
 * @remarks
 * This is a convenience wrapper around the `CommandBus.command` method.
 * Commands allow for decoupled communication between services.
 *
 * @group Commands
 *
 * @template R - Type of the expected result from the command execution.
 * @template D - Type of the data (payload) passed to the command.
 * @template T - Type of the command identifier.
 *
 * @param container - Inversify {@link Container} to resolve the {@link CommandBus} from.
 * @param type - Unique identifier of the command to dispatch.
 * @param data - Optional payload for the command handler.
 * @returns A descriptor to track the command execution and result.
 *
 * @example
 * ```typescript
 * const descriptor = command<User, UserFindParameters>(
 *   container,
 *   "FIND_USER",
 *   { id: "123" }
 * );
 *
 * const user: User = await descriptor.task;
 * ```
 */
declare function command<R = unknown, D = unknown, T extends CommandType = CommandType>(container: Container$1, type: T, data?: D): CommandDescriptor<R>;

/**
 * Dispatches a command through the {@link CommandBus} resolved from the container, returning null if no handler exists.
 *
 * @remarks
 * This is a convenience wrapper around the `CommandBus.commandOptional` method.
 * Unlike {@link command}, it does not throw if no handler is registered.
 *
 * @group Commands
 *
 * @template R - Type of the expected result from the command execution.
 * @template D - Type of the data (payload) passed to the command.
 * @template T - Type of the command identifier.
 *
 * @param container - Inversify {@link Container} to resolve the {@link CommandBus} from.
 * @param type - Unique identifier of the command to dispatch.
 * @param data - Optional payload for the command handler.
 * @returns A {@link CommandDescriptor} if a handler was found, or `null` otherwise.
 *
 * @example
 * ```typescript
 * const descriptor = commandOptional<User, FindUserOptions>(
 *   container,
 *   "FIND_USER",
 *   { id: "123" }
 * );
 *
 * if (descriptor) {
 *   const user: User = await descriptor.task;
 * }
 * ```
 */
declare function commandOptional<R = unknown, D = unknown, T extends CommandType = CommandType>(container: Container$1, type: T, data?: D): Optional$1<CommandDescriptor<R>>;

/**
 * Decorator for service methods that handle a specific command.
 *
 * @remarks
 * Methods decorated with `@OnCommand` are automatically registered as command handlers
 * when the service is bound via {@link bindService}.
 *
 * @group Commands
 *
 * @param type - Unique identifier of the command to handle.
 * @returns A method decorator function.
 *
 * @example
 * ```typescript
 * class UserService {
 *   @OnCommand("USER_LOGIN")
 *   private onUserLogin(credentials: Credentials): Promise<Session> {
 *     return auth.login(credentials);
 *   }
 * }
 * ```
 */
declare function OnCommand(type: CommandType): MethodDecorator;

/**
 * Orchestrates command dispatching and handler registration.
 *
 * @remarks
 * The `CommandBus` provides a way to decouple command dispatchers from their handlers.
 * It supports handler shadowing: when multiple handlers are registered for the same type,
 * the last registered one takes priority.
 *
 * @group Commands
 */
declare class CommandBus {
    /**
     * Internal handler storage.
     * Uses a stack for each command type to support shadowing.
     */
    private readonly handlers;
    /**
     * Removes all registered command handlers from the bus.
     */
    clear(): void;
    /**
     * Dispatches a command to the last registered handler.
     *
     * @remarks
     * Execution is always asynchronous. The handler's return value is wrapped in a Promise.
     * Returns a {@link CommandDescriptor} that tracks the execution status and task.
     *
     * @template R - Type of the command result.
     * @template D - Type of the command payload data.
     *
     * @param type - Command identifier.
     * @param data - Optional payload for the handler.
     * @returns A descriptor for the executing command.
     *
     * @throws {@link WirestateError} If no handler is registered.
     *
     * @example
     * ```typescript
     * const descriptor: CommandDescriptor<User> = commandBus.command<User, string>("GET_USER", "id-123");
     * const user: User = await descriptor.task;
     * ```
     */
    command<R = unknown, D = unknown>(type: CommandType, data?: D): CommandDescriptor<R>;
    /**
     * Dispatches a command if a handler exists, otherwise returns null.
     *
     * @template R - Type of the command result.
     * @template D - Type of the command payload data.
     *
     * @param type - Command identifier.
     * @param data - Optional payload for the handler.
     * @returns A command descriptor, or `null` if no handler is found.
     */
    commandOptional<R = unknown, D = unknown>(type: CommandType, data?: D): Optional$1<CommandDescriptor<R>>;
    /**
     * Checks if at least one handler is registered for the given command type.
     *
     * @param type - Command identifier.
     * @returns `true` if a handler is available, `false` otherwise.
     */
    has(type: CommandType): boolean;
    /**
     * Registers a handler for a specific command type.
     *
     * @remarks
     * If multiple handlers are registered for the same type, they are stored in a stack.
     * The most recently registered handler will be used for dispatching.
     *
     * @template D - Type of the command payload data.
     * @template R - Type of the command execution result.
     *
     * @param type - Command identifier.
     * @param handler - Function to execute when the command is dispatched.
     * @returns A function to unregister the handler.
     *
     * @example
     * ```typescript
     * const unregister: CommandUnregister = commandBus.register("LOG_MESSAGE", (message: string) => {
     *   console.log(message);
     * });
     * ```
     */
    register<D = unknown, R = unknown>(type: CommandType, handler: CommandHandler<D, R>): CommandUnregister;
    /**
     * Removes a previously registered command handler.
     *
     * @remarks
     * If the handler was not registered for the given type, this operation does nothing.
     *
     * @template D - Type of the command payload data.
     * @template R - Type of the command execution result.
     *
     * @param type - Command identifier.
     * @param handler - The handler function instance to remove.
     */
    unregister<D = unknown, R = unknown>(type: CommandType, handler: CommandHandler<D, R>): void;
}

/**
 * Represents a lookup key for service seeds.
 *
 * @remarks
 * Supports class constructors (for targeted seeds), strings, or symbols.
 *
 * @group Seeds
 */
type SeedKey = Newable | string | symbol;
/**
 * Represents a key-value map for targeted seeds.
 *
 * @remarks
 * Used to store initial state values that are injected into services
 * based on their class constructor or a custom token.
 *
 * @group Seeds
 *
 * @template T - The type of values stored in the map.
 */
type SeedsMap<T = unknown> = Map<SeedKey, T>;
/**
 * Represents a single service-to-seed mapping entry.
 *
 * @remarks
 * Represented as a readonly tuple of `[SeedKey, T]`.
 *
 * @group Seeds
 *
 * @template T - The type of the seed value.
 */
type SeedEntry<T = unknown> = readonly [SeedKey, T];
/**
 * Represents a collection of seed entries.
 *
 * @remarks
 * Used during container initialization to populate the {@link SeedsMap}.
 *
 * @group Seeds
 */
type SeedEntries = ReadonlyArray<SeedEntry>;

/**
 * Represents configuration options for {@link createContainer}.
 *
 * @group Container
 */
interface CreateContainerOptions {
    /**
     * Optional parent container.
     * Enables hierarchical resolution and sharing of bindings.
     */
    readonly parent?: Container$1;
    /**
     * Initial data for the root seed.
     * Accessible via {@link WireScope.getSeed}() in services.
     */
    readonly seed?: AnyObject;
    /**
     * Targeted seeds bound to specific injectables or tokens.
     */
    readonly seeds?: SeedEntries;
    /**
     * Injectables to be bound to the container.
     *
     * @remarks
     * Supports class constructors and {@link InjectableDescriptor} configurations.
     */
    readonly entries?: ReadonlyArray<Newable<object> | InjectableDescriptor>;
    /**
     * Services to resolve immediately.
     *
     * @remarks
     * Listed services must also be present in the `entries` array.
     */
    readonly activate?: ReadonlyArray<ServiceIdentifier>;
}
/**
 * Creates an Inversify IoC container pre-configured with Wirestate essentials.
 *
 * @remarks
 * The container is initialized with:
 * - State management tokens: `SEEDS_TOKEN` and `SEED_TOKEN`.
 * - Messaging buses: {@link EventBus}, {@link QueryBus}, {@link CommandBus}.
 * - Service bridge: {@link WireScope} (bound in transient scope).
 * - Default scope set to `Singleton`.
 *
 * @group Container
 *
 * @param options - {@link CreateContainerOptions} configuration.
 * @returns A new Inversify {@link Container} instance.
 *
 * @example
 * ```typescript
 * const container: Container = createIocContainer({
 *   seeds: [
 *     [CounterService, { count: 1000 }],
 *     ["SOME_KEY", "VALUE"],
 *   ],
 *   entries: [CounterService, LoggerService],
 *   activate: [LoggerService]
 * });
 *
 * bindService(container, MyService);
 * ```
 */
declare function createContainer(options?: CreateContainerOptions): Container$1;

/**
 * Represents an Event identifier.
 *
 * @group Events
 */
type EventType = string | symbol;
/**
 * Represents an event object.
 *
 * @group Events
 */
interface Event<P = unknown, T extends EventType = EventType, F = unknown> {
    readonly type: T;
    readonly payload?: P;
    readonly from?: F;
}
/**
 * Represents event handler signature.
 *
 * @group Events
 */
type EventHandler<E extends Event = Event> = (event: E) => void;
/**
 * Represents event bus unsubscribing function, part of events subscription lifecycle.
 *
 * @group Events
 */
type EventUnsubscriber = () => void;

/**
 * Represents unique identifier for a query.
 *
 * @remarks
 * Queries use a request-response pattern. Using symbols is recommended for
 * private or internal queries to avoid naming collisions.
 *
 * @group Queries
 *
 * @example
 * ```typescript
 * const GET_USER_QUERY: QueryType = Symbol("GET_USER");
 * ```
 */
type QueryType = string | symbol;
/**
 * Represents signature for a function that handles queries of a specific type.
 *
 * @remarks
 * Query handlers can be synchronous or asynchronous. They receive a payload
 * and must return a result (or a Promise resolving to it).
 *
 * @group Queries
 *
 * @template D - Type of the input data (payload).
 * @template R - Type of the returned result.
 *
 * @example
 * ```typescript
 * const handler: QueryHandler<string, User> = (userId) => userRepository.find(userId);
 * ```
 */
type QueryHandler<D = unknown, R = unknown> = (data: D) => MaybePromise$1<R>;
/**
 * Represents function returned by registration methods to remove a query handler.
 *
 * @group Queries
 *
 * @example
 * ```typescript
 * const unregister: QueryUnregister = queryBus.register("QUERY_TYPE", handler);
 *
 * unregister(); // Handler is no longer active
 * ```
 */
type QueryUnregister = () => void;

/**
 * A transient bridge providing services with access to Wirestate buses, lazy resolution, and seeds.
 *
 * @remarks
 * Every service bound via {@link bindService} receives its own unique `WireScope` instance.
 * It acts as a facade to the IoC container while enforcing lifecycle safety.
 *
 * Methods are available only while the scope is "active" (after service activation and before deactivation).
 *
 * @group Container
 */
declare class WireScope {
    private readonly container;
    /**
     * Whether the scope was deactivated and disposed from the container.
     */
    readonly isDisposed: boolean;
    constructor(container: Optional$1<Container$1>);
    /**
     * Provides direct access to the underlying Inversify {@link Container}.
     *
     * @returns The active {@link Container}.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     *
     * @example
     * ```typescript
     * const container: Container = scope.getContainer();
     *
     * container.bind("TOKEN").toConstantValue(42);
     * ```
     */
    getContainer(): Container$1;
    /**
     * Lazily resolves a service or value from the container.
     *
     * @remarks
     * Use this to break circular dependencies or for services that are not needed immediately.
     *
     * @template T - Type of the service or value to resolve.
     *
     * @param injectionId - Service token (class constructor, symbol, or string).
     * @returns The resolved instance or value.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     * @throws {Error} If the service cannot be resolved from the container.
     *
     * @example
     * ```typescript
     * const service: MyService = scope.resolve(MyService);
     * ```
     */
    resolve<T>(injectionId: ServiceIdentifier<T>): T;
    /**
     * Lazily resolves a service if it is bound, otherwise returns null.
     *
     * @template T - Type of the service or value to resolve.
     *
     * @param injectionId - Service token (class constructor, symbol, or string).
     * @returns The resolved instance, value, or `null` if not bound.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     *
     * @example
     * ```typescript
     * const logger: Logger | null = scope.resolveOptional(Logger);
     *
     * logger?.info("Resolved optionally");
     * ```
     */
    resolveOptional<T>(injectionId: ServiceIdentifier<T>): Optional$1<T>;
    /**
     * Dispatches an event to the {@link EventBus}.
     *
     * @template P - Type of the event payload.
     * @template T - Type of the event identifier.
     *
     * @param type - Event identifier.
     * @param payload - Optional data associated with the event.
     * @param from - Optional source identifier (defaults to current scope).
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     *
     * @example
     * ```typescript
     * scope.emitEvent("VALUE_CHANGED", { value: "abcd" });
     * ```
     */
    emitEvent<P, T extends EventType = EventType>(type: T, payload?: P, from?: unknown): void;
    /**
     * Subscribes to all events on the {@link EventBus}.
     *
     * @param handler - Function called for every emitted event.
     * @returns A function to unsubscribe.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     *
     * @example
     * ```typescript
     * const unsubscribe: EventUnsubscriber = scope.subscribeToEvent((event) => {
     *   console.log("Event received:", event);
     * });
     * ```
     */
    subscribeToEvent(handler: EventHandler): EventUnsubscriber;
    /**
     * Unsubscribes a specific handler from the {@link EventBus}.
     *
     * @param handler - The handler instance to remove.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     *
     * @example
     * ```typescript
     * scope.unsubscribeFromEvent(this.onEvent);
     * ```
     */
    unsubscribeFromEvent(handler: EventHandler): void;
    /**
     * Dispatches a query and waits for the result.
     *
     * @template R - Type of the query result.
     * @template D - Type of the query data (payload).
     * @template T - Type of the query identifier.
     *
     * @param type - Query identifier.
     * @param data - Input data for the query handler.
     * @returns The query result (can be a Promise).
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     * @throws {@link WirestateError} If no query handler is registered.
     *
     * @example
     * ```typescript
     * const user: User = await scope.queryData("GET_USER", { id: 1 });
     * ```
     */
    queryData<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): MaybePromise$1<R>;
    /**
     * Dispatches a query and returns the result, or null if no handler is registered.
     *
     * @template R - Type of the query result.
     * @template D - Type of the query data (payload).
     * @template T - Type of the query identifier.
     *
     * @param type - Query identifier.
     * @param data - Input data for the query handler.
     * @returns The query result or `null`.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     *
     * @example
     * ```typescript
     * const config: Config | null = await scope.queryOptionalData("GET_CONFIG");
     * ```
     */
    queryOptionalData<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): Optional$1<MaybePromise$1<R>>;
    /**
     * Registers a handler for a specific query type.
     *
     * @template D - Type of the query data (payload).
     * @template R - Type of the query result.
     *
     * @param type - Query identifier.
     * @param handler - The handler function.
     * @returns A function to unregister the handler.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     *
     * @example
     * ```typescript
     * scope.registerQueryHandler("GET_DATE_NOW", () => new Date());
     * ```
     */
    registerQueryHandler<D = unknown, R = unknown>(type: QueryType, handler: QueryHandler<D, R>): QueryUnregister;
    /**
     * Removes a specific query handler registration.
     *
     * @template D - Type of the query data (payload).
     * @template R - Type of the query result.
     *
     * @param type - Query identifier.
     * @param handler - The handler instance to remove.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     *
     * @example
     * ```typescript
     * scope.unregisterQueryHandler("GET_DATE_NOW", this.onGetDateNow);
     * ```
     */
    unregisterQueryHandler<D = unknown, R = unknown>(type: QueryType, handler: QueryHandler<D, R>): void;
    /**
     * Dispatches a command and returns a descriptor to track its progress.
     *
     * @template R - Type of the command result.
     * @template D - Type of the command payload.
     * @template T - Type of the command identifier.
     *
     * @param type - Command identifier.
     * @param data - Payload for the command.
     * @returns A {@link CommandDescriptor}.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     * @throws {@link WirestateError} If no command handler is registered.
     *
     * @example
     * ```typescript
     * const descriptor: CommandDescriptor = scope.executeCommand("LOGOUT");
     *
     * await descriptor.task;
     * ```
     */
    executeCommand<R = unknown, D = unknown, T extends CommandType = CommandType>(type: T, data?: D): CommandDescriptor<R>;
    /**
     * Dispatches a command if a handler is registered, otherwise returns null.
     *
     * @template R - Type of the command result.
     * @template D - Type of the command payload.
     * @template T - Type of the command identifier.
     *
     * @param type - Command identifier.
     * @param data - Payload for the command.
     * @returns A {@link CommandDescriptor} or `null`.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     *
     * @example
     * ```typescript
     * const descriptor: CommandDescriptor | null = scope.executeOptionalCommand("CLEANUP_CACHE");
     *
     * if (descriptor) {
     *   await descriptor.task;
     * }
     * ```
     */
    executeOptionalCommand<R = unknown, D = unknown, T extends CommandType = CommandType>(type: T, data?: D): Optional$1<CommandDescriptor<R>>;
    /**
     * Registers a handler for a specific command type.
     *
     * @template D - Type of the command payload.
     * @template R - Type of the command result.
     *
     * @param type - Command identifier.
     * @param handler - The handler function.
     * @returns A function to unregister the handler.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     *
     * @example
     * ```typescript
     * scope.registerCommandHandler("LOG_ERROR", (error) => {
     *   console.error(error);
     * });
     * ```
     */
    registerCommandHandler<D = unknown, R = unknown>(type: CommandType, handler: CommandHandler<D, R>): CommandUnregister;
    /**
     * Removes a specific command handler registration.
     *
     * @template D - Type of the command payload.
     * @template R - Type of the command result.
     *
     * @param type - Command identifier.
     * @param handler - The handler instance to remove.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     *
     * @example
     * ```typescript
     * scope.unregisterCommandHandler("LOG_ERROR", this.handleLogError);
     * ```
     */
    unregisterCommandHandler<D = unknown, R = unknown>(type: CommandType, handler: CommandHandler<D, R>): void;
    /**
     * Retrieves the global seed object (initial state) from the container.
     *
     * @remarks
     * Use this to access the entire seed object when no specific key is provided.
     *
     * @template T - Expected type of the global seed object.
     * @returns The global seed object.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     *
     * @example
     * ```typescript
     * interface GlobalSeed {
     *   apiUrl: string;
     * }
     *
     * const seeds: GlobalSeed = scope.getSeed();
     * ```
     */
    getSeed<T extends AnyObject>(): T;
    /**
     * Retrieves a specific seed value by key from the container's seed map.
     *
     * @remarks
     * Use this to retrieve individual values registered in the seed map.
     *
     * @template T - Expected type of the seed value.
     * @param seed - Lookup key (identifier or token) for the seed.
     * @returns The seed value or `null` if not found.
     *
     * @throws {@link WirestateError} If accessed before activation or after disposal.
     *
     * @example
     * ```typescript
     * const apiUrl: string = scope.getSeed("API_URL");
     * ```
     */
    getSeed<T>(seed: SeedKey): Optional$1<T>;
}

/**
 * Base error class for all Wirestate-related exceptions.
 *
 * @remarks
 * `WirestateError` provides structured error information, including a numeric error code
 * and a descriptive message. It is used throughout the library to signal lifecycle
 * violations, messaging failures, and configuration issues.
 *
 * @group Error
 *
 * @example
 * ```typescript
 * try {
 *   scope.getContainer();
 * } catch (error) {
 *   if (error instanceof WirestateError) {
 *     console.error(`Error code: ${error.code}`);
 *   }
 * }
 * ```
 */
declare class WirestateError extends Error {
    /**
     * The name of the error class, useful for identification in minified environments.
     */
    readonly name: string;
    /**
     * Numeric error code identifying the specific failure type.
     */
    readonly code: number;
    /**
     * Human-readable description of the error.
     */
    readonly message: string;
    /**
     * Creates a new instance of WirestateError.
     *
     * @param code - Numeric identifier for the error (defaults to ERROR_CODE_GENERIC).
     * @param detail - Optional descriptive message.
     */
    constructor(code?: number, detail?: string);
}

/**
 * Broadcasts an event to all subscribers via the {@link EventBus} resolved from the container.
 *
 * @remarks
 * Use this utility to emit events from outside a service's {@link WireScope} (e.g., from a bootstrap script or external controller).
 *
 * @group Events
 *
 * @template P - Type of the event payload.
 * @template T - Type of the event identifier.
 *
 * @param container - Inversify {@link Container} to resolve the {@link EventBus} from.
 * @param type - Unique event identifier.
 * @param payload - Optional data associated with the event.
 * @param from - Optional source identifier.
 *
 * @example
 * ```typescript
 * emitEvent(container, "SYSTEM_READY", { version: "1.0.0" });
 * ```
 */
declare function emitEvent<P, T extends EventType>(container: Container$1, type: T, payload?: P, from?: unknown): void;

/**
 * Decorator for service methods that respond to events.
 *
 * @remarks
 * Methods decorated with `@OnEvent` are automatically registered as subscribers
 * when the service is bound via {@link bindService}.
 *
 * You can specify one or more event types to handle. If `types` is omitted,
 * the method acts as a catch-all handler for all events broadcasted to the {@link EventBus}.
 *
 * @group Events
 *
 * @param types - Event identifier(s) to handle. If omitted, handles all events.
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * class MyService {
 *   @OnEvent("USER_LOGGED_IN")
 *   private onLogin(event: Event<User>): void {
 *     console.log("User logged in:", event);
 *   }
 *
 *   @OnEvent(["LOGOUT", "SESSION_EXPIRED"])
 *   private onSessionEnd(event: Event): void {
 *     console.log("Specific event received:", event);
 *   }
 *
 *   @OnEvent()
 *   private onAnyEvent(event: Event): void {
 *     // Catch-all handler
 *   }
 * }
 * ```
 */
declare function OnEvent(types?: EventType | ReadonlyArray<EventType>): MethodDecorator;

/**
 * Orchestrates event broadcasting to multiple subscribers.
 *
 * @remarks
 * The `EventBus` facilitates decoupled, many-to-many communication.
 * Unlike commands or queries, which are dispatched to a single handler,
 * events are broadcast to all registered subscribers.
 *
 * @group Events
 */
declare class EventBus {
    private readonly handlers;
    /**
     * Broadcasts an event to all registered subscribers.
     *
     * @remarks
     * Handlers are executed in a try-catch block to ensure that a single
     * failing subscriber does not prevent others from receiving the event.
     *
     * @template P - Type of the event payload.
     * @template T - Type of the event identifier.
     * @template F - Type of the event source.
     *
     * @param event - The event object to broadcast.
     *
     * @example
     * ```typescript
     * eventBus.emit({
     *   type: "USER_LOGGED_IN",
     *   payload: { userId: "123" },
     *   from: AuthService
     * });
     * ```
     */
    emit<P = unknown, T extends EventType = EventType, F = unknown>(event: Event<P, T, F>): void;
    /**
     * Registers a handler to receive all broadcasted events.
     *
     * @param handler - Function invoked for every emitted event.
     * @returns An {@link EventUnsubscriber} function to remove the subscription.
     *
     * @example
     * ```typescript
     * const unsubscribe: EventUnsubscriber = eventBus.subscribe((event) => {
     *   console.log('Received event:', event);
     * });
     * ```
     */
    subscribe(handler: EventHandler): EventUnsubscriber;
    /**
     * Removes a previously registered event handler.
     *
     * @remarks
     * If the handler was not subscribed, this operation does nothing.
     *
     * @param handler - The handler function instance to remove.
     */
    unsubscribe(handler: EventHandler): void;
    /**
     * Checks if the bus has any active subscribers.
     *
     * @returns `true` if at least one handler is registered, `false` otherwise.
     */
    has(): boolean;
    /**
     * Removes all registered handlers from the bus.
     *
     * @internal
     */
    clear(): void;
}

/**
 * Dispatches a query through the {@link QueryBus} resolved from the container.
 *
 * @remarks
 * This is a convenience wrapper around the `QueryBus.query` method.
 * Queries allow for decoupled request-response communication between services.
 *
 * @group Queries
 *
 * @template R - Type of the expected query result.
 * @template D - Type of the input data (payload).
 *
 * @param container - Inversify {@link Container} to resolve the {@link QueryBus} from.
 * @param type - Unique query identifier.
 * @param data - Optional input data for the query handler.
 * @returns The query result (can be a Promise).
 *
 * @throws {@link WirestateError} If no query handler is registered.
 *
 * @example
 * ```typescript
 * const result: string = await query<string, FindUserParameters>(
 *   container,
 *   "GET_USER_NAME",
 *   { id: 123 }
 * );
 * ```
 */
declare function query<R = unknown, D = unknown>(container: Container$1, type: QueryType, data?: D): MaybePromise$1<R>;

/**
 * Dispatches a query through the {@link QueryBus}, returning null if no handler is registered.
 *
 * @remarks
 * This is a convenience wrapper around the `QueryBus.queryOptional` method.
 * Use this when the query resolution is optional and you want to avoid catching errors.
 *
 * @group Queries
 *
 * @template R - Type of the expected query result.
 * @template D - Type of the input data (payload).
 *
 * @param container - Inversify {@link Container} to resolve the {@link QueryBus} from.
 * @param type - Unique query identifier.
 * @param data - Optional input data for the query handler.
 * @returns The query result or `null` if no handler exists.
 *
 * @example
 * ```typescript
 * const config: Config | null = await queryOptional<Config>(container, "GET_OPTIONAL_CONFIG");
 * ```
 */
declare function queryOptional<R = unknown, D = unknown>(container: Container$1, type: QueryType, data?: D): Optional$1<MaybePromise$1<R>>;

/**
 * Orchestrates query dispatching and handler registration.
 *
 * @remarks
 * The `QueryBus` provides a request-response mechanism for decoupled communication.
 * It supports handler shadowing: when multiple handlers are registered for the same type,
 * the last registered one (e.g., at the component level) takes priority over earlier ones
 * (e.g., at the global service level).
 *
 * @group Queries
 */
declare class QueryBus {
    /**
     * Internal handler storage.
     * Uses a stack for each query type to support shadowing (e.g., component-level vs service-level).
     */
    private readonly handlers;
    /**
     * Registers a handler for a specific query type.
     *
     * @remarks
     * If multiple handlers are registered for the same type, they are stored in a stack.
     * The most recently registered handler will be used for resolution.
     *
     * @template D - Type of the query input data.
     * @template R - Type of the query result.
     *
     * @param type - Unique query identifier.
     * @param handler - Function to execute when the query is dispatched.
     * @returns A function to unregister the handler.
     *
     * @example
     * ```typescript
     * const unregister: QueryUnregister = queryBus.register("GET_NOW", () => Date.now());
     * ```
     */
    register<D = unknown, R = unknown>(type: QueryType, handler: QueryHandler<D, R>): QueryUnregister;
    /**
     * Removes a previously registered query handler.
     *
     * @remarks
     * If the handler was not registered for the given type, this operation does nothing.
     *
     * @template D - Type of the query input data.
     * @template R - Type of the query result.
     *
     * @param type - Unique query identifier.
     * @param handler - The handler function instance to remove.
     */
    unregister<D = unknown, R = unknown>(type: QueryType, handler: QueryHandler<D, R>): void;
    /**
     * Dispatches a query to the last registered handler and returns the result.
     *
     * @remarks
     * Query handlers can be synchronous or asynchronous. The result is returned as-is
     * (or as a Promise if the handler is async).
     *
     * @template R - Type of the expected query result.
     * @template D - Type of the data (payload) passed to the query.
     * @template T - Type of the query identifier.
     *
     * @param type - Unique query identifier.
     * @param data - Optional input data for the handler.
     * @returns The result of the query execution.
     *
     * @throws {@link WirestateError} If no handler is registered for the given type.
     *
     * @example
     * ```typescript
     * const user: User = await queryBus.query<User, string>("FIND_USER", "user-id-123");
     * ```
     */
    query<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): MaybePromise$1<R>;
    /**
     * Dispatches a query if a handler exists, otherwise returns null.
     *
     * @template R - Type of the expected query result.
     * @template D - Type of the data (payload) passed to the query.
     * @template T - Type of the query identifier.
     *
     * @param type - Unique query identifier.
     * @param data - Optional input data for the handler.
     * @returns The query result, or `null` if no handler is found.
     */
    queryOptional<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): Optional$1<MaybePromise$1<R>>;
    /**
     * Checks if at least one handler is registered for the given query type.
     *
     * @param type - Unique query identifier.
     * @returns `true` if a handler is available, `false` otherwise.
     */
    has(type: QueryType): boolean;
    /**
     * Removes all registered query handlers from the bus.
     *
     * @internal
     */
    clear(): void;
}

/**
 * Decorator for service methods that respond to a query.
 *
 * @remarks
 * Methods decorated with `@OnQuery` are automatically registered as query handlers
 * when the service is bound via {@link bindService}.
 *
 * Unlike events, queries MUST be handled by exactly one handler. If multiple handlers
 * are registered for the same query type, the most recent one (usually the most
 * specific in terms of class hierarchy or registration order) will shadow the others.
 *
 * @group Queries
 *
 * @param type - Unique query identifier to handle.
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * class UserProfileService {
 *   @OnQuery("GET_USER_AVATAR")
 *   private async onGetUserAvatar(userId: string): Promise<string> {
 *     const user: User = await this.userRepository.findById(userId);
 *
 *     return user.avatarUrl;
 *   }
 * }
 * ```
 */
declare function OnQuery(type: QueryType): MethodDecorator;

/**
 * Unique symbol used as a token for the container-scoped seeds map.
 *
 * @remarks
 * This token is used to bind and resolve the {@link SeedsMap} in the Inversify {@link Container}.
 *
 * @group Seeds
 *
 * @example
 * ```typescript
 * const seedsMap: SeedsMap = container.get(SEEDS_TOKEN);
 * ```
 */
declare const SEEDS_TOKEN: unique symbol;
/**
 * Unique symbol used as a token for the container-scoped shared seed object.
 *
 * @remarks
 * This token is used to bind and resolve the global shared seed object in the Inversify {@link Container}.
 *
 * @group Seeds
 *
 * @example
 * ```typescript
 * const sharedSeed: AnyObject = container.get(SEED_TOKEN);
 * ```
 */
declare const SEED_TOKEN: unique symbol;

/**
 * Applies targeted seeds to the container's internal seed map.
 *
 * @remarks
 * This function updates the existing {@link SeedsMap} instance instead of replacing it.
 * This ensures that multiple providers can co-exist and contribute their own seeds
 * without overwriting each other's data.
 *
 * @group Seeds
 *
 * @param container - The Inversify {@link Container} where seeds should be applied.
 * @param seeds - An array of {@link SeedEntries} to add to the container.
 *
 * @example
 * ```typescript
 * applySeeds(container, [
 *   [UserService, { initialUser: "admin" }],
 *   ["API_KEY", "12345"]
 * ]);
 * ```
 */
declare function applySeeds(container: Container$1, seeds: SeedEntries): void;

/**
 * Rebinds the global shared seed object in the container.
 *
 * @remarks
 * Unlike targeted seeds, there is only one shared seed object per container.
 * This function uses `rebind` to ensure the new shared seed replaces the previous one.
 * The shared seed is typically used for global configuration or common state.
 *
 * @group Seeds
 *
 * @param container - The Inversify {@link Container} to update.
 * @param seed - The new shared seed object.
 *
 * @example
 * ```typescript
 * applySharedSeed(container, { theme: "dark", lang: "en" });
 * ```
 */
declare function applySharedSeed(container: Container$1, seed: AnyObject): void;

/**
 * Removes specific targeted seeds from the container's internal seed map.
 *
 * @remarks
 * This is typically called during provider unmounting to ensure that only
 * the seeds owned by that specific provider are removed, leaving other
 * providers' seeds intact.
 *
 * @group Seeds
 *
 * @param container - The Inversify {@link Container} to clean up.
 * @param seeds - The targeted {@link SeedEntries} to remove.
 *
 * @example
 * ```typescript
 * unapplySeeds(container, [[UserService, { initialUser: "admin" }]]);
 * ```
 */
declare function unapplySeeds(container: Container$1, seeds: SeedEntries): void;

/**
 * Decorator for service methods that should be executed after the service instance is activated.
 *
 * @remarks
 * Methods decorated with `@OnActivated` are automatically invoked when the service
 * is resolved from the container and its activation lifecycle hook is triggered.
 *
 * It is commonly used for initial setup, subscribing to events, or starting background tasks.
 * Multiple `@OnActivated` methods can exist in the same class hierarchy; they are executed
 * in parent-to-child order.
 *
 * @group Service
 *
 * @returns A method decorator function.
 *
 * @example
 * ```typescript
 * class MyService {
 *   @OnActivated()
 *   public onActivated(): void {
 *     console.log("Service activated!");
 *   }
 * }
 * ```
 */
declare function OnActivated(): MethodDecorator;

/**
 * Decorator for service methods that should be executed before the service instance is deactivated.
 *
 * @remarks
 * Methods decorated with `@OnDeactivation` are automatically invoked when the service
 * is being removed from the container or when the container itself is being disposed.
 *
 * It is commonly used for cleanup, unsubscribing from events, or stopping background tasks.
 * Multiple `@OnDeactivation` methods can exist in the same class hierarchy; they are executed
 * in parent-to-child order.
 *
 * @group Service
 *
 * @returns A method decorator function.
 *
 * @example
 * ```typescript
 * class MyService {
 *   @OnDeactivation()
 *   public onDeactivation(): void {
 *     console.log("Service deactivating!");
 *   }
 * }
 * ```
 */
declare function OnDeactivation(): MethodDecorator;

/**
 * Represents options for {@link mockBindService}.
 *
 * @group Test-utils
 */
interface MockBindServiceOptions {
    /**
     * Whether to skip the activation lifecycle for the service.
     *
     * @remarks
     * If true, `@OnActivated` and `@OnDeactivation` hooks will not be triggered.
     *
     * @default false
     */
    skipLifecycle?: boolean;
}
/**
 * Binds a service class to the IoC container for testing purposes.
 *
 * @remarks
 * This utility is a testing wrapper for {@link bindService}.
 * It ensures the service is correctly registered with singleton scope and lifecycle metadata.
 *
 * @group Test-utils
 *
 * @template T - The type of the service being bound.
 *
 * @param container - The Inversify {@link Container} to bind the service to.
 * @param ServiceClass - The service class constructor to bind.
 * @param options - Configuration options for the mock binding.
 *
 * @example
 * ```typescript
 * mockBindService(container, AnalyticsService);
 * ```
 */
declare function mockBindService<T extends object>(container: Container$1, ServiceClass: Newable<T>, options?: MockBindServiceOptions): void;

/**
 * Represents options for {@link mockBindEntry}.
 *
 * @group Test-utils
 */
interface MockBindEntryOptions {
    /**
     * Whether to skip the activation lifecycle for the entry.
     *
     * @remarks
     * If true, `@OnActivated` and `@OnDeactivation` hooks will not be triggered.
     * This only applies when the entry is a service class or an instance binding.
     *
     * @default false
     */
    skipLifecycle?: boolean;
}
/**
 * Binds a service entry to the IoC container for testing purposes.
 *
 * @remarks
 * This utility is a testing wrapper for {@link bindEntry}.
 * It supports both service classes and {@link InjectableDescriptor} objects.
 *
 * @group Test-utils
 *
 * @template T - The type of the service being bound.
 *
 * @param container - The Inversify {@link Container} to bind the entry to.
 * @param entry - The service class constructor or {@link InjectableDescriptor} to bind.
 * @param options - Configuration options for the mock binding.
 *
 * @example
 * ```typescript
 * mockBindEntry(container, UserService, { skipLifecycle: true });
 * ```
 */
declare function mockBindEntry<T extends object>(container: Container$1, entry: Newable<T> | InjectableDescriptor, options?: MockBindEntryOptions): void;

/**
 * Unbinds a service from the IoC container.
 *
 * @remarks
 * This is a convenience wrapper for `container.unbind`.
 * It is useful in tests to reset or override specific service registrations
 * between test cases.
 *
 * @group Test-utils
 *
 * @template T - The type of the service to unbind.
 *
 * @param container - The Inversify {@link Container} to unbind from.
 * @param ServiceClass - The service class constructor to unbind.
 *
 * @example
 * ```typescript
 * mockUnbindService(container, LegacyService);
 * ```
 */
declare function mockUnbindService<T extends object>(container: Container$1, ServiceClass: Newable<T>): void;

/**
 * Represents options for {@link mockContainer}.
 *
 * @group Test-utils
 */
interface MockContainerOptions {
    /**
     * Optional parent container.
     * Enables hierarchical resolution and sharing of bindings.
     */
    readonly parent?: Container$1;
    /**
     * Initial data for the root seed.
     */
    readonly seed?: AnyObject;
    /**
     * Targeted seeds bound to specific injectables or tokens.
     */
    readonly seeds?: SeedEntries;
    /**
     * List of services or injectable descriptors to bind to the container.
     *
     * @remarks
     * Accepts class constructors or {@link InjectableDescriptor} objects.
     */
    readonly entries?: Array<Newable<object> | InjectableDescriptor>;
    /**
     * List of injection identifiers to immediately activate after binding.
     *
     * @remarks
     * Activating a service triggers its resolution and `@OnActivated` hooks.
     * All identifiers must correspond to entries provided in the `entries` list.
     */
    readonly activate?: Array<ServiceIdentifier>;
    /**
     * Whether to skip the activation lifecycle for all bound services.
     *
     * @remarks
     * If true, `@OnActivated` and `@OnDeactivation` hooks will not be triggered.
     *
     * @default false
     */
    readonly skipLifecycle?: boolean;
}
/**
 * Mocks and configures an Inversify {@link Container} for testing.
 *
 * @remarks
 * This utility initializes a new container via {@link createContainer} and
 * binds the provided `entries` using {@link mockBindEntry}. It can also
 * automatically resolve (activate) a subset of services.
 *
 * @group Test-utils
 *
 * @param options - Configuration options for the mock container.
 * @returns A configured Inversify {@link Container}.
 *
 * @throws {WirestateError} If an identifier in `activate` is not found in `entries`.
 *
 * @example
 * ```typescript
 * const container: Container = mockContainer({
 *   entries: [UserService, AuthService],
 *   activate: [AuthService]
 * });
 * ```
 */
declare function mockContainer(options?: MockContainerOptions): Container$1;

/**
 * Represents options for {@link mockService}.
 *
 * @group Test-utils
 */
interface MockServiceOptions {
    /**
     * If true, skips lifecycle hooks (e.g., `@OnActivated`) during binding and instantiation.
     *
     * @default false
     */
    skipLifecycle?: boolean;
}
/**
 * Mocks a service by binding it to an IoC container and returning its resolved instance.
 *
 * @remarks
 * This is a high-level utility that combines {@link mockContainer} and {@link mockBindService}.
 * If no container is provided, a fresh one is created.
 *
 * @group Test-utils
 *
 * @template T - The type of the service being mocked.
 *
 * @param service - The service class constructor to mock.
 * @param container - The Inversify container to use (defaults to a new mock container).
 * @param options - Additional options for mocking.
 * @returns The resolved service instance.
 *
 * @example
 * ```typescript
 * const service: MyService = mockService(MyService);
 * ```
 */
declare function mockService<T extends object>(service: Newable<T>, container?: Container, options?: MockServiceOptions): T;

/**
 * Represents a value that can be of type `T` or `null`.
 *
 * @group general-types
 *
 * @template T - The base type.
 */
type Optional<T> = T | null;
/**
 * Represents a value that can be of type `T` or a `Promise` resolving to `T`.
 *
 * @group general-types
 *
 * @template T - The base type.
 */
type MaybePromise<T> = T | Promise<T>;

/**
 * Represents signature for a function that dispatches commands.
 *
 * @remarks
 * Typically returned by {@link useCommandCaller}. Dispatched commands are
 * automatically wrapped in a {@link CommandDescriptor}.
 *
 * @group Commands
 *
 * @template R - The expected result type of the command task.
 * @template D - The type of the data payload.
 * @template T - The command identifier type.
 *
 * @param type - The command identifier.
 * @param data - Optional payload for the command.
 *
 * @returns A descriptor containing the execution task and status.
 */
type CommandCaller = <R = unknown, D = unknown, T extends CommandType = CommandType>(type: T, data?: D) => CommandDescriptor<R>;
/**
 * Represents signature for a function that dispatches optional commands.
 *
 * @remarks
 * Typically returned by {@link useOptionalCommandCaller}. Returns `null` if no
 * handler is registered for the command type, instead of throwing.
 *
 * @group Commands
 *
 * @template R - The expected result type of the command task.
 * @template D - The type of the data payload.
 * @template T - The command identifier type.
 *
 * @param type - The command identifier.
 * @param data - Optional payload for the command.
 *
 * @returns A descriptor if a handler was found, or `null` otherwise.
 */
type OptionalCommandCaller = <R = unknown, D = unknown, T extends CommandType = CommandType>(type: T, data?: D) => Optional<CommandDescriptor<R>>;

/**
 * Returns a stable function to dispatch commands on the active container.
 *
 * @remarks
 * The returned dispatcher is memoized using `useCallback` and stays stable
 * for the lifetime of the container. It uses {@link CommandBus.command} internally.
 *
 * @group Commands
 *
 * @returns A command dispatcher function that takes a type and optional data.
 *
 * @example
 * ```tsx
 * const call: CommandCaller = useCommandCaller();
 *
 * const onClick = () => call("SAVE_USER_COMMAND", { id: 1 });
 * ```
 */
declare function useCommandCaller(): CommandCaller;

/**
 * Returns a stable function to dispatch optional commands on the active container.
 *
 * @remarks
 * Similar to {@link useCommandCaller}, but returns `null` instead of throwing
 * {WirestateError} if no handler is registered for the command type.
 * Uses {@link CommandBus.commandOptional} internally.
 *
 * @group Commands
 *
 * @returns An optional command dispatcher function.
 *
 * @example
 * ```tsx
 * const callOptional: OptionalCommandCaller = useOptionalCommandCaller();
 * const descriptor: CommandDescriptor<string> | null = callOptional("OPTIONAL_COMMAND", data);
 *
 * if (descriptor) {
 *   const result: string = await descriptor.task;
 * }
 * ```
 */
declare function useOptionalCommandCaller(): OptionalCommandCaller;

/**
 * Registers a command handler for the component's lifetime.
 *
 * @remarks
 * The handler is stored in a `useRef` and synced on every render to avoid stale
 * closures without requiring manual memoization of the handler function.
 * Only one handler is active per type; newer registrations shadow older ones.
 * The handler is automatically unregistered when the component unmounts.
 *
 * @group Commands
 *
 * @template R - Result type of the command.
 * @template D - Data/payload type of the command.
 *
 * @param type - Command type (string or symbol).
 * @param handler - Command handler function.
 *
 * @example
 * ```tsx
 * useCommandHandler("SAVE_COMMAND", (data) => {
 *   return api.save(data);
 * });
 * ```
 */
declare function useCommandHandler<R = unknown, D = unknown>(type: CommandType, handler: CommandHandler<D, R>): void;

/**
 * Returns the active container from the context.
 *
 * @remarks
 * Use this hook when you need direct access to the {@link Container} for manual
 * resolution or checking bindings. For typical service usage, prefer
 * {@link useInjection}.
 *
 * @group Context
 *
 * @returns The active container.
 *
 * @example
 * ```tsx
 * const container: Container = useContainer();
 * const isBound: boolean = container.isBound(MyToken);
 * ```
 */
declare function useContainer(): Container$1;

/**
 * Creates and memoizes a root container for a component.
 *
 * @remarks
 * The `factory` function re-runs only when one of `deps` changes.
 * Between such changes, the same container instance is returned.
 *
 * @group Context
 *
 * @param factory - Lazily creates the root container.
 * @param deps - Dependency list controlling when container is recreated.
 * @returns The memoized root container instance.
 *
 * @example
 * ```tsx
 * const container: Container = useRootContainer(
 *   () =>
 *     createIocContainer({
 *       entries: [CounterService, LoggerService],
 *     }),
 *   []
 * );
 * ```
 */
declare function useRootContainer(factory: () => Container$1, deps: Array<unknown>): Container$1;

/**
 * Returns a {@link WireScope} instance bound to the active container.
 *
 * @remarks
 * The scope is recreated if the container changes. It provides a convenient
 * way to access container features like events, commands, and queries.
 *
 * @group Context
 *
 * @returns A {@link WireScope} instance.
 *
 * @example
 * ```tsx
 * const scope: WireScope = useScope();
 *
 * scope.emitEvent("UI_READY");
 * ```
 */
declare function useScope(): WireScope;

/**
 * Subscribes a component to a specific event type on the {@link EventBus}.
 *
 * @remarks
 * The subscription is active for the component's lifetime and is automatically
 * cleaned up on unmount. The handler is synced via `useRef` to avoid stale
 * closures without requiring manual memoization of the handler function.
 *
 * @group Events
 *
 * @param type - Event type to listen for.
 * @param handler - Function invoked when the specified event is emitted.
 *
 * @example
 * ```tsx
 * useEvent("USER_LOGGED_IN", (event) => {
 *   console.log("User logged in:,", event);
 * });
 * ```
 */
declare function useEvent(type: EventType, handler: EventHandler): void;

/**
 * Subscribes a component to multiple event types on the {@link EventBus}.
 *
 * @remarks
 * Similar to {@link useEvent}, but allows listening for a collection of event
 * types using a single handler.
 * The handler and type list are synced via `useRef` to avoid stale closures.
 *
 * @group Events
 *
 * @param types - Array of event types (strings or symbols) to filter by.
 * @param handler - Function invoked when any of the specified events are emitted.
 *
 * @example
 * ```tsx
 * useEvents(["USER_UPDATED", "USER_DELETED"], (event) => {
 *   refreshList();
 * });
 * ```
 */
declare function useEvents(types: ReadonlyArray<EventType>, handler: EventHandler): void;

/**
 * Subscribes a component to all events on the {@link EventBus} without type filtering.
 *
 * @remarks
 * Useful for logging, debugging, or cross-cutting concerns that need to see
 * every event passing through the bus.
 * The handler is synced via `useRef` to avoid stale closures.
 * The subscription is automatically cleaned up on unmount.
 *
 * @group Events
 *
 * @param handler - Event handler invoked for every emitted event.
 *
 * @example
 * ```tsx
 * useEventsHandler((event) => {
 *   console.log('Event receieved:', event.type, event.payload);
 * });
 * ```
 */
declare function useEventsHandler(handler: EventHandler): void;

/**
 * Represents signature for a function that emits events via the EventBus.
 *
 * @remarks
 * Typically returned by {@link useEventEmitter}. Supports optional payload
 * and source identifier.
 *
 * @group Events
 *
 * @template P - The type of the event payload.
 * @template T - The event identifier type.
 * @template F - The type of the event source identifier.
 *
 * @param type - The event identifier.
 * @param payload - Optional data associated with the event.
 * @param from - Optional identifier of the event source.
 */
type EventEmitter<P = unknown, T extends EventType = EventType, F = unknown> = (type: T, payload?: P, from?: F) => void;

/**
 * Returns a stable function to emit events via the {@link EventBus}.
 *
 * @remarks
 * The returned emitter is memoized using `useCallback` and stays stable
 * for the lifetime of the container.
 *
 * @group Events
 *
 * @template P - Default payload type for emitted events.
 * @template T - Default event identifier type.
 *
 * @returns An event emitter function.
 *
 * @example
 * ```tsx
 * const emit: EventEmitter = useEventEmitter();
 *
 * const onClick = () => emit("BUTTON_CLICKED", { id: "submit" });
 * ```
 */
declare function useEventEmitter<P = unknown, T extends EventType = EventType>(): EventEmitter<P, T>;

/**
 * Resolves a service or constant from the active container.
 *
 * @remarks
 * This hook automatically re-resolves the dependency if the container's
 * revision changes (e.g., due to re-binding in a provider).
 *
 * @group Injection
 *
 * @template T - The type of the value being resolved.
 *
 * @param injectionId - The service identifier (string, symbol, or constructor).
 *
 * @returns The resolved instance or value.
 *
 * @throws {WirestateError} If the container is not found in context.
 * @throws {Error} If Inversify fails to resolve the identifier.
 *
 * @example
 * ```tsx
 * const api: ApiService = useInjection(ApiService);
 * ```
 */
declare function useInjection<T>(injectionId: ServiceIdentifier<T>): T;

/**
 * Safely resolves a value from the container, returning a fallback or null if not bound.
 *
 * @remarks
 * Unlike {@link useInjection}, this hook does not throw if the dependency
 * is missing from the container.
 *
 * @group Injection
 *
 * @template T - The type of the value being resolved.
 *
 * @param injectionId - The service identifier (string, symbol, or constructor).
 * @param onFallback - Optional function called to provide a value if the token is not bound.
 *
 * @returns The resolved value, the result of the fallback function, or `null`.
 *
 * @example
 * ```tsx
 * const logger = useOptionalInjection(FileLogger, (container) => container.get(ConsoleLoggerService);
 * ```
 */
declare function useOptionalInjection<T>(injectionId: ServiceIdentifier<T>, onFallback?: (container: Container$1) => T): Optional<T>;

/**
 * Props accepted by {@link SubContainerProvider}.
 *
 * @group Provision
 */
interface SubContainerProviderProps {
    /**
     * Targeted seeds applied before entries are bound.
     *
     * @remarks
     * Seed changes do not recreate the child container. Pass a React `key` to
     * force a remount when you need to re-seed the subtree.
     */
    readonly seeds?: SeedEntries;
    /**
     * Services or descriptors bound inside the child container.
     *
     * @remarks
     * The child container is recreated when this array changes by shallow
     * comparison or when the parent container changes.
     */
    readonly entries: InjectableEntries;
    /**
     * React subtree that receives the child container.
     */
    readonly children?: ReactNode;
}
/**
 * Provides a child container derived from the nearest parent container.
 *
 * @remarks
 * The provider owns the child container. It disposes the previous child before
 * exposing a replacement, recreates on parent or `entries` changes, and revives
 * a cleaned child after React development remount cleanup.
 *
 * @group Provision
 *
 * @param props - Provider props.
 * @returns A React context provider for the child container.
 */
declare function SubContainerProvider(props: SubContainerProviderProps): react.FunctionComponentElement<react.ProviderProps<any>>;

/**
 * Represents props for {@link ContainerActivator}.
 *
 * @group Provision
 */
interface ContainerActivatorProps {
    /**
     * Services to resolve immediately on render.
     *
     * @remarks
     * Listed services must be bound in current container.
     */
    readonly activate: ReadonlyArray<ServiceIdentifier>;
    /**
     * Nested child node.
     */
    readonly children?: ReactNode;
}
/**
 * Resolves specified services from the current IoC container before rendering children.
 *
 * @remarks
 * Activation runs once per container instance.
 * On rerender with the same container, services are not resolved again.
 *
 * @group Provision
 *
 * @param props - Component properties.
 * @param props.activate - Services to resolve eagerly from container.
 * @param props.children - React children element.
 * @returns React children after activation side effect is applied.
 */
declare function ContainerActivator(props: ContainerActivatorProps): ReactElement<any, string | react.JSXElementConstructor<any>>;

/**
 * Describes how {@link ContainerProvider} receives its root container.
 *
 * @remarks
 * Pass an existing {@link Container} when ownership lives outside React. Pass
 * {@link CreateContainerOptions} when the provider should create and dispose a
 * managed container for the subtree.
 */
type ContainerProviderSource = Container$1 | CreateContainerOptions;
/**
 * Props accepted by {@link ContainerProvider}.
 *
 * @group Provision
 */
interface ContainerProviderProps {
    /**
     * Container instance or options used to create one.
     *
     * @remarks
     * External container instances are never disposed by this provider. Managed
     * containers created from options are disposed on unmount and recreated when
     * the `entries` array changes by shallow comparison.
     */
    readonly container: ContainerProviderSource;
    /**
     * React subtree that receives the active container.
     */
    readonly children?: ReactNode;
}
/**
 * Provides a root Wirestate container to a React subtree.
 *
 * @remarks
 * The provider supports two modes:
 *
 * - External mode: `container` is a prebuilt {@link Container}. The provider
 *   only passes it through context.
 * - Managed mode: `container` is {@link CreateContainerOptions}. The provider
 *   creates a container, owns its disposal, recreates it when `entries` change,
 *   and revives it after React development remount cleanup.
 *
 * @group Provision
 *
 * @param props - Provider props.
 * @returns A React context provider for the active container.
 */
declare function ContainerProvider(props: ContainerProviderProps): react.FunctionComponentElement<react.ProviderProps<any>>;

/**
 * Represents signature for a function that responds to a query.
 *
 * @group Queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 *
 * @param data - Optional payload for the query.
 *
 * @returns The query result, possibly as a promise.
 */
type QueryResponder<R = unknown, D = unknown> = (data?: D) => MaybePromise<R>;
/**
 * Represents signature for a function that dispatches queries and returns their result.
 *
 * @remarks
 * Typically returned by {@link useQueryCaller}.
 *
 * @group Queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 * @template T - The query identifier type.
 *
 * @param type - The query identifier.
 * @param data - Optional payload for the query.
 *
 * @returns The query result as a value or promise.
 */
type QueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D) => MaybePromise<R>;
/**
 * Represents signature for a function that dispatches synchronous queries.
 *
 * @remarks
 * Typically returned by {@link useSyncQueryCaller}.
 *
 * @group Queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 * @template T - The query identifier type.
 *
 * @param type - The query identifier.
 * @param data - Optional payload for the query.
 *
 * @returns The query result directly.
 */
type SyncQueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D) => R;
/**
 * Represents signature for a function that dispatches optional queries.
 *
 * @remarks
 * Typically returned by {@link useOptionalQueryCaller}. Returns `null` when
 * no handler is registered.
 *
 * @group Queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 * @template T - The query identifier type.
 *
 * @param type - The query identifier.
 * @param data - Optional payload for the query.
 *
 * @returns The query result, or `null` if no handler was found.
 */
type OptionalQueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D) => Optional<MaybePromise<R>>;
/**
 * Represents signature for a function that dispatches optional synchronous queries.
 *
 * @remarks
 * Typically returned by {@link useOptionalSyncQueryCaller}. Returns `null`
 * when no handler is registered.
 *
 * @group Queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 * @template T - The query identifier type.
 *
 * @param type - The query identifier.
 * @param data - Optional payload for the query.
 *
 * @returns The query result directly, or `null` if no handler was found.
 */
type OptionalSyncQueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D) => Optional<R>;

/**
 * Returns a stable function to dispatch queries on the active container.
 *
 * @remarks
 * The returned dispatcher is memoized using `useCallback` and stays stable
 * for the lifetime of the container. It uses {@link QueryBus.query} internally.
 *
 * @group Queries
 *
 * @returns A query dispatcher function.
 *
 * @example
 * ```tsx
 * const query: QueryCaller = useQueryCaller();
 * const result: UserProfile = await query(GET_USER_PROFILE, { id: 123 });
 * ```
 */
declare function useQueryCaller(): QueryCaller;

/**
 * Returns a stable function to dispatch optional queries on the active container.
 *
 * @remarks
 * The returned dispatcher is memoized using `useCallback` and stays stable
 * for the lifetime of the container. It returns `null` instead of throwing
 * if no handler is registered.
 *
 * @group Queries
 *
 * @returns An optional query dispatcher function.
 *
 * @example
 * ```tsx
 * const queryOptional: OptionalQueryCaller = useOptionalQueryCaller();
 * const settings: UserSettings | null = await queryOptional(GET_USER_SETTINGS, { id: 1 });
 * ```
 */
declare function useOptionalQueryCaller(): OptionalQueryCaller;

/**
 * Registers a query handler for the component's lifetime.
 *
 * @remarks
 * The handler is stored in a `useRef` and synced on every render to avoid stale
 * closures. Only one handler is active per type; newer registrations shadow older ones.
 * The handler is automatically unregistered when the component unmounts.
 *
 * @group Queries
 *
 * @template R - Result type of the query.
 * @template D - Data/payload type of the query.
 * @template T - Query identifier type.
 *
 * @param type - Query identifier (string or symbol).
 * @param handler - Function that responds to the query.
 *
 * @example
 * ```tsx
 * useQueryHandler("GET_DATA", (data) => {
 *   return { id: data.id, value: "Resolved" };
 * });
 * ```
 */
declare function useQueryHandler<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, handler: QueryHandler<D, R>): void;

/**
 * Returns a stable function to dispatch synchronous queries.
 *
 * @remarks
 * The returned dispatcher returns the value directly from the handler
 * instead of a Promise (unless the handler itself returns a Promise).
 * Memoized using `useCallback`.
 *
 * @group Queries
 *
 * @returns A synchronous query dispatcher function.
 *
 * @example
 * ```tsx
 * const querySync: SyncQueryCaller = useSyncQueryCaller();
 * const config: ApplicationConfig = querySync("GET_APP_CONFIG");
 * ```
 */
declare function useSyncQueryCaller(): SyncQueryCaller;

/**
 * Returns a stable function to dispatch synchronous optional queries.
 *
 * @remarks
 * Similar to {@link useOptionalQueryCaller}, but returns the value directly
 * (synchronously) from the handler. Returns `null` if no handler is registered.
 *
 * @group Queries
 *
 * @returns An optional synchronous query dispatcher function.
 *
 * @example
 * ```tsx
 * const querySyncOptional: OptionalSyncQueryCaller = useOptionalSyncQueryCaller();
 * const value: ThemePreference | null = querySyncOptional(GET_THEME_PREFERENCE);
 * ```
 */
declare function useOptionalSyncQueryCaller(): OptionalSyncQueryCaller;

/**
 * Wraps a React element tree with {@link ContainerProvider} for testing purposes.
 *
 * @remarks
 * This utility simplifies setting up the IoC context in unit tests. It automatically
 * creates a {@link mockContainer} if none is provided.
 *
 * @group Test-utils
 *
 * @param children - The React tree to be wrapped.
 * @param container - An optional Inversify container. Defaults to a new {@link mockContainer}.
 * @returns A React element wrapped in an {@link ContainerProvider}.
 *
 * @example
 * ```tsx
 * const container: Container = createIocContainer();
 *
 * render(withIocProvider(<MyComponent />, container));
 * ```
 */
declare function withContainerProvider(children: ReactNode, container?: Container$1): react.FunctionComponentElement<{
    container: Container$1;
}>;

export { CommandBus, CommandStatus, ContainerActivator, ContainerProvider, EventBus, OnActivated, OnCommand, OnDeactivation, OnEvent, OnQuery, QueryBus, SEED_TOKEN as SEED, SEEDS_TOKEN as SEEDS, SubContainerProvider, WireScope, WirestateError, applySeeds, applySharedSeed, bindConstant, bindDynamicValue, bindEntry, bindService, command, commandOptional, createContainer, emitEvent, forwardRef, getEntryToken, mockBindEntry, mockBindService, mockContainer, mockService, mockUnbindService, query, queryOptional, unapplySeeds, useCommandCaller, useCommandHandler, useContainer, useEvent, useEventEmitter, useEvents, useEventsHandler, useInjection, useOptionalCommandCaller, useOptionalInjection, useOptionalQueryCaller, useOptionalSyncQueryCaller, useQueryCaller, useQueryHandler, useRootContainer, useScope, useSyncQueryCaller, withContainerProvider };
export type { BindEntryOptions, BindServiceOptions, CommandCaller, CommandDescriptor, CommandHandler, CommandType, CommandUnregister, ContainerActivatorProps, ContainerProviderProps, CreateContainerOptions, Event, EventEmitter, EventHandler, EventType, EventUnsubscriber, InjectableDescriptor, OptionalCommandCaller, OptionalQueryCaller, OptionalSyncQueryCaller, QueryCaller, QueryHandler, QueryResponder, QueryType, QueryUnregister, SeedEntries, SeedEntry, SeedKey, SeedsMap, SubContainerProviderProps, SyncQueryCaller };
