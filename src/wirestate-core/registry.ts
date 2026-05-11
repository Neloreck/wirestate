import type { Container } from "inversify";

import type { WireScope } from "./container/wire-scope";
import type { CommandHandlerMetadata, CommandUnregister } from "./types/commands";
import type { EventUnsubscriber, EventHandlerMetadata } from "./types/events";
import type { QueryHandlerMetadata, QueryUnregister } from "./types/queries";

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
export const SEEDS_TOKEN: unique symbol = Symbol("@wirestate/core/seeds");

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
export const SEED_TOKEN: unique symbol = Symbol("@wirestate/core/seed");

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
 * Registry of class constructors to their `@OnActivated`-decorated method names.
 *
 * @remarks
 * This map is populated by the {@link OnActivated} decorator. Activation hooks are
 * executed in parent-to-child order during service initialization.
 *
 * @group Service
 * @internal
 */
export const ACTIVATED_HANDLER_METADATA: WeakMap<object, Array<string | symbol>> = new WeakMap();

/**
 * Registry of class constructors to their `@OnDeactivation`-decorated method names.
 *
 * @remarks
 * This map is populated by the {@link OnDeactivation} decorator. Deactivation hooks are
 * executed in parent-to-child order during service disposal.
 *
 * @group Service
 * @internal
 */
export const DEACTIVATION_HANDLER_METADATA: WeakMap<object, Array<string | symbol>> = new WeakMap();

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
