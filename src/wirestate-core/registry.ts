import type { Container } from "inversify";

import type { WireScope } from "./container/wire-scope";
import type { CommandHandlerMetadata, CommandUnregister } from "./types/commands";
import type { EventUnsubscriber, EventHandlerMetadata } from "./types/events";
import type { QueryHandlerMetadata, QueryUnregister } from "./types/queries";

/**
 * Token for the container-scoped seeds map.
 *
 * @group seeds
 */
export const SEEDS_TOKEN: unique symbol = Symbol("@wirestate/seeds");

/**
 * Token for the container-scoped shared seed object.
 *
 * @group seeds
 */
export const SEED_TOKEN: unique symbol = Symbol("@wirestate/seed");

/**
 * Map of class constructors to their declared query handlers.
 * Inherited via a prototype chain at resolve time.
 *
 * @group queries
 * @internal
 */
export const QUERY_HANDLER_METADATA: WeakMap<object, Array<QueryHandlerMetadata>> = new WeakMap();

/**
 * Map of class constructors to their declared command handlers.
 * Inherited via a prototype chain at resolve time.
 *
 * @group commands
 * @internal
 */
export const COMMAND_HANDLER_METADATA: WeakMap<object, Array<CommandHandlerMetadata>> = new WeakMap();

/**
 * Map of class constructors to their `@OnActivated`-decorated method names.
 * Inherited via a prototype chain at resolve time.
 *
 * @group service
 * @internal
 */
export const ACTIVATED_HANDLER_METADATA: WeakMap<object, Array<string | symbol>> = new WeakMap();

/**
 * Map of class constructors to their `@OnDeactivation`-decorated method names.
 * Inherited via a prototype chain at resolve time.
 *
 * @group service
 * @internal
 */
export const DEACTIVATION_HANDLER_METADATA: WeakMap<object, Array<string | symbol>> = new WeakMap();

/**
 * Map of class constructors for their declared event handlers.
 * Inherited via a prototype chain at resolve time.
 *
 * @group events
 * @internal
 */
export const EVENT_HANDLER_METADATA: WeakMap<object, Array<EventHandlerMetadata>> = new WeakMap();

/**
 * Private storage for service-to-container references.
 *
 * @group bind
 * @internal
 */
export const CONTAINER_REFS_BY_SERVICE: WeakMap<object, Container> = new WeakMap();

/**
 * Private storage for injected WireScope instances per service.
 *
 * @group container
 * @internal
 */
export const WIRE_SCOPES_BY_SERVICE: WeakMap<object, Array<WireScope>> = new WeakMap();

/**
 * Private storage for service event unsubscribers.
 *
 * @group events
 * @internal
 */
export const EVENT_UNSUBSCRIBERS_BY_SERVICE: WeakMap<object, EventUnsubscriber> = new WeakMap();

/**
 * Private storage for service query unregisters.
 *
 * @group queries
 * @internal
 */
export const QUERY_UNREGISTERS_BY_SERVICE: WeakMap<object, Array<QueryUnregister>> = new WeakMap();

/**
 * Private storage for service command unregisters.
 *
 * @group commands
 * @internal
 */
export const COMMAND_UNREGISTERS_BY_SERVICE: WeakMap<object, Array<CommandUnregister>> = new WeakMap();
