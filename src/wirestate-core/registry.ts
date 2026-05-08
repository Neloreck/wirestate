import type { Container } from "inversify";

import type { WireScope } from "@/wirestate-core/container/wire-scope";
import type { CommandHandlerMetadata, CommandUnregister } from "@/wirestate-core/types/commands";
import type { EventUnsubscriber, EventHandlerMetadata } from "@/wirestate-core/types/events";
import type { QueryHandlerMetadata, QueryUnregister } from "@/wirestate-core/types/queries";

/**
 * Token for the container-scoped seeds map.
 */
export const SEEDS_TOKEN: unique symbol = Symbol("@wirestate/seeds");

/**
 * Token for the container-scoped shared seed object.
 */
export const SEED_TOKEN: unique symbol = Symbol("@wirestate/seed");

/**
 * Map of class constructors to their declared query handlers.
 * Inherited via a prototype chain at resolve time.
 */
export const QUERY_HANDLER_METADATA: WeakMap<object, Array<QueryHandlerMetadata>> = new WeakMap();

/**
 * Map of class constructors to their declared command handlers.
 * Inherited via a prototype chain at resolve time.
 */
export const COMMAND_HANDLER_METADATA: WeakMap<object, Array<CommandHandlerMetadata>> = new WeakMap();

/**
 * Map of class constructors to their `@OnActivated`-decorated method names.
 * Inherited via a prototype chain at resolve time.
 */
export const ACTIVATED_HANDLER_METADATA: WeakMap<object, Array<string | symbol>> = new WeakMap();

/**
 * Map of class constructors to their `@OnDeactivation`-decorated method names.
 * Inherited via a prototype chain at resolve time.
 */
export const DEACTIVATION_HANDLER_METADATA: WeakMap<object, Array<string | symbol>> = new WeakMap();

/**
 * Map of class constructors for their declared event handlers.
 * Inherited via a prototype chain at resolve time.
 */
export const EVENT_HANDLER_METADATA: WeakMap<object, Array<EventHandlerMetadata>> = new WeakMap();

/**
 * Private storage for service-to-container references.
 */
export const CONTAINER_REFS_BY_SERVICE: WeakMap<object, Container> = new WeakMap();

/**
 * Private storage for injected WireScope instances per service.
 */
export const WIRE_SCOPES_BY_SERVICE: WeakMap<object, Array<WireScope>> = new WeakMap();

/**
 * Private storage for service event unsubscribers.
 */
export const EVENT_UNSUBSCRIBERS_BY_SERVICE: WeakMap<object, EventUnsubscriber> = new WeakMap();

/**
 * Private storage for service query unregisters.
 */
export const QUERY_UNREGISTERS_BY_SERVICE: WeakMap<object, Array<QueryUnregister>> = new WeakMap();

/**
 * Private storage for service command unregisters.
 */
export const COMMAND_UNREGISTERS_BY_SERVICE: WeakMap<object, Array<CommandUnregister>> = new WeakMap();
