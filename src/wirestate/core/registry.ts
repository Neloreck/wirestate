import { Container } from "inversify";

import type { IQueryHandlerMetadata, TQueryUnregister } from "@/wirestate//types/queries";
import type { TSignalUnsubscribe, ISignalHandlerMetadata } from "@/wirestate//types/signals";
import type { AbstractService } from "@/wirestate/core/service/abstract-service";
import type { ICommandHandlerMetadata, TCommandUnregister } from "@/wirestate/types/commands";

/**
 * Token for the container-scoped signal bus.
 */
export const SIGNAL_BUS_TOKEN: unique symbol = Symbol("@wirestate/signal-bus");

/**
 * Token for the container-scoped query bus.
 */
export const QUERY_BUS_TOKEN: unique symbol = Symbol("@wirestate/query-bus");

/**
 * Token for the container-scoped command bus.
 */
export const COMMAND_BUS_TOKEN: unique symbol = Symbol("@wirestate/command-bus");

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
export const QUERY_HANDLER_METADATA: WeakMap<object, Array<IQueryHandlerMetadata>> = new WeakMap();

/**
 * Map of class constructors to their declared command handlers.
 * Inherited via a prototype chain at resolve time.
 */
export const COMMAND_HANDLER_METADATA: WeakMap<object, Array<ICommandHandlerMetadata>> = new WeakMap();

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
 * Map of class constructors for their declared signal handlers.
 * Inherited via a prototype chain at resolve time.
 */
export const SIGNAL_HANDLER_METADATA: WeakMap<object, Array<ISignalHandlerMetadata>> = new WeakMap();

/**
 * Private storage for service-to-container references.
 */
export const CONTAINER_REFS_BY_SERVICE: WeakMap<AbstractService, Container> = new WeakMap();

/**
 * Private storage for service signal unsubscribers.
 */
export const SIGNAL_UNSUBSCRIBERS_BY_SERVICE: WeakMap<AbstractService, TSignalUnsubscribe> = new WeakMap();

/**
 * Private storage for service query unregisters.
 */
export const QUERY_UNREGISTERS_BY_SERVICE: WeakMap<AbstractService, Array<TQueryUnregister>> = new WeakMap();

/**
 * Private storage for service command unregisters.
 */
export const COMMAND_UNREGISTERS_BY_SERVICE: WeakMap<AbstractService, Array<TCommandUnregister>> = new WeakMap();
