import { Container } from "inversify";

import type { AbstractService } from "./service/AbstractService";
import type { IQueryHandlerMetadata, TQueryUnregister } from "./types/queries";
import type { TSignalUnsubscribe } from "./types/signals";
import type { ISignalHandlerMetadata } from "./types/signals";

/**
 * Token for the container-scoped signal bus.
 */
export const SIGNAL_BUS_TOKEN: unique symbol = Symbol.for(
  "@wirestate/signal-bus",
);

/**
 * Token for the container-scoped query bus.
 */
export const QUERY_BUS_TOKEN: unique symbol = Symbol.for(
  "@wirestate/query-bus",
);

/**
 * Token for the container-scoped initial-state map.
 */
export const INITIAL_STATE_TOKEN: unique symbol = Symbol.for(
  "@wirestate/initial-state",
);

/**
 * Token for the container-scoped shared initial-state object.
 */
export const INITIAL_STATE_SHARED_TOKEN: unique symbol = Symbol.for(
  "@wirestate/initial-state/shared",
);

/**
 * Map of class constructors to their declared query handlers.
 * Inherited via prototype chain at resolve time.
 */
export const QUERY_HANDLER_METADATA: WeakMap<
  object,
  Array<IQueryHandlerMetadata>
> = new WeakMap();

/**
 * Map of class constructors to their declared signal handlers.
 * Inherited via prototype chain at resolve time.
 */
export const SIGNAL_HANDLER_METADATA: WeakMap<
  object,
  Array<ISignalHandlerMetadata>
> = new WeakMap();

/**
 * Private storage for service-to-container references.
 */
export const CONTAINER_REFS_BY_SERVICE: WeakMap<AbstractService, Container> =
  new WeakMap();

/**
 * Private storage for service signal unsubscribers.
 */
export const SIGNAL_UNSUBSCRIBERS_BY_SERVICE: WeakMap<
  AbstractService,
  TSignalUnsubscribe
> = new WeakMap();

/**
 * Private storage for service query unregisters.
 */
export const QUERY_UNREGISTERS_BY_SERVICE: WeakMap<
  AbstractService,
  Array<TQueryUnregister>
> = new WeakMap();
