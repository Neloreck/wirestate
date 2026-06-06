import { Container, Identifier } from "./alias";
import { WireScope } from "./container/wire-scope";
import { CommandHandlerMetadata, CommandUnregister } from "./types/commands";
import { InternalErrorHandler } from "./types/error";
import { EventHandlerMetadata, EventUnsubscriber } from "./types/events";
import { Binding, ProvisionId } from "./types/provision";
import { QueryHandlerMetadata, QueryUnregister } from "./types/queries";

/**
 * Registry of class constructors to their declared query handlers.
 *
 * @remarks
 * This map is populated by the {@link OnQuery} decorator. Handlers are
 * inherited via the prototype chain at instance resolution time.
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
 * inherited via the prototype chain at instance resolution time.
 *
 * @group Commands
 * @internal
 */
export const COMMAND_HANDLER_METADATA: WeakMap<object, Array<CommandHandlerMetadata>> = new WeakMap();

/**
 * Registry of class constructors to their `@OnActivated`-decorated method name.
 *
 * @remarks
 * This map is populated by the {@link OnActivated} decorator.
 *
 * @group Bind
 * @internal
 */
export const ACTIVATED_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Registry of class constructors to their `@OnDeactivation`-decorated method name.
 *
 * @remarks
 * This map is populated by the {@link OnDeactivation} decorator.
 *
 * @group Bind
 * @internal
 */
export const DEACTIVATION_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Registry of class constructors to their `@OnProvision`-decorated method name.
 *
 * @remarks
 * This map is populated by the {@link OnProvision} decorator.
 *
 * @group Bind
 * @internal
 */
export const PROVISION_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Registry of class constructors to their `@OnDeprovision`-decorated method name.
 *
 * @remarks
 * This map is populated by the {@link OnDeprovision} decorator.
 *
 * @group Bind
 * @internal
 */
export const DEPROVISION_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Registry of class constructors to their declared event handlers.
 *
 * @remarks
 * This map is populated by the {@link OnEvent} decorator. Event handlers are
 * inherited via the prototype chain at instance resolution time.
 *
 * @group Events
 * @internal
 */
export const EVENT_HANDLER_METADATA: WeakMap<object, Array<EventHandlerMetadata>> = new WeakMap();

/**
 * Internal storage for mapping instances to their originating Inversify containers.
 *
 * @remarks
 * Used during the instance lifecycle to ensure that resolution and messaging
 * occur within the correct container context.
 *
 * @group Bind
 * @internal
 */
export const CONTAINER_REFS_BY_INSTANCE: WeakMap<object, Container> = new WeakMap();

/**
 * Internal storage for managing injected {@link WireScope} per instance.
 *
 * @remarks
 * Tracks the scopes associated with an instance for lifecycle management and cleanup.
 *
 * @group Container
 * @internal
 */
export const SCOPES_BY_INSTANCE: WeakMap<object, Array<WireScope>> = new WeakMap();

/**
 * Internal storage for event unsubscribers.
 *
 * @remarks
 * Stores the unsubscription functions returned when an instance automatically
 * subscribes to events via the {@link OnEvent} decorator.
 *
 * @group Events
 * @internal
 */
export const EVENT_UNSUBSCRIBERS_BY_INSTANCE: WeakMap<object, EventUnsubscriber> = new WeakMap();

/**
 * Internal storage for instance query unregisters.
 *
 * @remarks
 * Stores the unregistration functions returned when an instance automatically
 * registers query handlers via the {@link OnQuery} decorator.
 *
 * @group Queries
 * @internal
 */
export const QUERY_UNREGISTERS_BY_INSTANCE: WeakMap<object, Array<QueryUnregister>> = new WeakMap();

/**
 * Internal storage for instance command unregisters.
 *
 * @remarks
 * Stores the unregistration functions returned when an instance automatically
 * registers command handlers via the {@link OnCommand} decorator.
 *
 * @group Commands
 * @internal
 */
export const COMMAND_UNREGISTERS_BY_INSTANCE: WeakMap<object, Array<CommandUnregister>> = new WeakMap();

/**
 * Internal storage for bindings registered on a container through Wirestate helpers.
 *
 * @group Container
 * @internal
 */
export const CONTAINER_BINDINGS: WeakMap<Container, Array<Binding>> = new WeakMap();

/**
 * Internal storage for provider lifecycle maps that currently own a container.
 *
 * @group Container
 * @internal
 */
export const PROVISION_LIFECYCLES_BY_CONTAINER: WeakMap<Container, Set<Map<Container, Array<object>>>> = new WeakMap();

/**
 * Internal storage for provider lifecycle tokens represented by an instance.
 *
 * @group Container
 * @internal
 */
export const PROVISION_TOKENS_BY_INSTANCE: WeakMap<object, Set<Identifier>> = new WeakMap();

/**
 * Internal storage for the latest provider provision cycle ID per instance.
 *
 * @group Container
 * @internal
 */
export const PROVISION_IDS_BY_INSTANCE: WeakMap<object, ProvisionId> = new WeakMap();

/**
 * Internal storage for container error handlers.
 *
 * @group Error
 * @internal
 */
export const WIRESTATE_INTERNAL_ERROR_HANDLERS: WeakMap<Container, InternalErrorHandler> = new WeakMap();

/**
 * Token used to expose a container's parent container through dependency injection.
 *
 * @group Container
 */
export const CONTAINER_PARENT_TOKEN: unique symbol = Symbol.for("@wirestate/core/container-parent");

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
 * import { SEEDS, type SeedsMap } from "@wirestate/core";
 *
 * const seedsMap: SeedsMap = container.get(SEEDS);
 * ```
 */

export const SEEDS_TOKEN: unique symbol = Symbol("@wirestate/core/seeds");
/**
 * Unique symbol used as a token for the container-scoped shared seed object.
 *
 * @remarks
 * This token is used to bind and resolve the shared seed object in the Inversify {@link Container}.
 *
 * @group Seeds
 *
 * @example
 * ```typescript
 * import { SEED } from "@wirestate/core";
 *
 * const sharedSeed: Record<string, unknown> = container.get(SEED);
 * ```
 */
export const SEED_TOKEN: unique symbol = Symbol("@wirestate/core/seed");
