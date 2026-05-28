import { Container, ServiceIdentifier } from "./alias";
import { WireScope } from "./container/wire-scope";
import { CommandHandlerMetadata, CommandUnregister } from "./types/commands";
import { EventHandlerMetadata, EventUnsubscriber } from "./types/events";
import { Bindings } from "./types/provision";
import { QueryHandlerMetadata, QueryUnregister } from "./types/queries";

/**
 * Registry of class constructors to their declared query handlers.
 *
 * @remarks
 * This map is populated by the {@link OnQuery} decorator. Handlers are
 * inherited via the prototype chain at service resolution time.
 *
 * @group Queries
 * @internal
 */
export const QUERY_HANDLER_METADATA: WeakMap<object, Array<QueryHandlerMetadata>> = new WeakMap();

/**
 * Registry of class constructors to their declared command handlers.
 *
 * @remarks
 * This map is populated by the {@link OnCommand} decorator. Handlers are
 * inherited via the prototype chain at service resolution time.
 *
 * @group Commands
 * @internal
 */
export const COMMAND_HANDLER_METADATA: WeakMap<object, Array<CommandHandlerMetadata>> = new WeakMap();

/**
 * Registry of class constructors to their `@OnActivated`-decorated method name.
 *
 * @remarks
 * This map is populated by the {@link OnActivated} decorator. A service class
 * hierarchy may declare one activation hook.
 *
 * @group Service
 * @internal
 */
export const ACTIVATED_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Registry of class constructors to their `@OnDeactivation`-decorated method name.
 *
 * @remarks
 * This map is populated by the {@link OnDeactivation} decorator. A service class
 * hierarchy may declare one deactivation hook.
 *
 * @group Service
 * @internal
 */
export const DEACTIVATION_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Registry of class constructors to their `@OnProvision`-decorated method name.
 *
 * @remarks
 * This map is populated by the {@link OnProvision} decorator. A service class
 * hierarchy may declare one provision hook.
 *
 * @group Service
 * @internal
 */
export const PROVISION_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Registry of class constructors to their `@OnDeprovision`-decorated method name.
 *
 * @remarks
 * This map is populated by the {@link OnDeprovision} decorator. A service class
 * hierarchy may declare one deprovision hook.
 *
 * @group Service
 * @internal
 */
export const DEPROVISION_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Registry of class constructors to their declared event handlers.
 *
 * @remarks
 * This map is populated by the {@link OnEvent} decorator. Event handlers are
 * inherited via the prototype chain at service resolution time.
 *
 * @group Events
 * @internal
 */
export const EVENT_HANDLER_METADATA: WeakMap<object, Array<EventHandlerMetadata>> = new WeakMap();

/**
 * Internal storage for mapping service instances to their originating Inversify containers.
 *
 * @remarks
 * Used during the service lifecycle to ensure that resolution and messaging
 * occur within the correct container context.
 *
 * @group Bind
 * @internal
 */
export const CONTAINER_REFS_BY_SERVICE: WeakMap<object, Container> = new WeakMap();

/**
 * Internal storage for managing injected {@link WireScope} instances per service.
 *
 * @remarks
 * Tracks the scopes associated with a service instance for lifecycle management
 * and cleanup.
 *
 * @group Container
 * @internal
 */
export const WIRE_SCOPES_BY_SERVICE: WeakMap<object, Array<WireScope>> = new WeakMap();

/**
 * Internal storage for service event unsubscribers.
 *
 * @remarks
 * Stores the unsubscription functions returned when a service automatically
 * subscribes to events via the {@link OnEvent} decorator.
 *
 * @group Events
 * @internal
 */
export const EVENT_UNSUBSCRIBERS_BY_SERVICE: WeakMap<object, EventUnsubscriber> = new WeakMap();

/**
 * Internal storage for service query unregisters.
 *
 * @remarks
 * Stores the unregistration functions returned when a service automatically
 * registers query handlers via the {@link OnQuery} decorator.
 *
 * @group Queries
 * @internal
 */
export const QUERY_UNREGISTERS_BY_SERVICE: WeakMap<object, Array<QueryUnregister>> = new WeakMap();

/**
 * Internal storage for service command unregisters.
 *
 * @remarks
 * Stores the unregistration functions returned when a service automatically
 * registers command handlers via the {@link OnCommand} decorator.
 *
 * @group Commands
 * @internal
 */
export const COMMAND_UNREGISTERS_BY_SERVICE: WeakMap<object, Array<CommandUnregister>> = new WeakMap();

/**
 * Internal storage for bindings registered on a container through Wirestate helpers.
 *
 * @group Container
 * @internal
 */
export const CONTAINER_BINDINGS: WeakMap<Container, Array<Bindings[number]>> = new WeakMap();

/**
 * Internal storage for provider lifecycle maps that currently own a container.
 *
 * @group Container
 * @internal
 */
export const PROVISION_LIFECYCLES_BY_CONTAINER: WeakMap<Container, Set<Map<Container, Array<object>>>> = new WeakMap();

/**
 * Internal storage for provider lifecycle tokens represented by a service instance.
 *
 * @group Container
 * @internal
 */
export const PROVISION_TOKENS_BY_SERVICE: WeakMap<object, Set<ServiceIdentifier>> = new WeakMap();
