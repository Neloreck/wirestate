// Install the Symbol.metadata polyfill before any consumer class definition.
import "./metadata/symbol-metadata";

import { Container, Identifier } from "./base";
import { WireStatus } from "./container/wire-status";
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
 * Standard decorator metadata key for query handlers declared with {@link OnQuery}.
 *
 * @remarks
 * TC39 standard decorators store an `Array<QueryHandlerMetadata>` under this
 * key on the class `Symbol.metadata` object.
 *
 * @group Queries
 * @internal
 */
export const QUERY_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/query");

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
 * Standard decorator metadata key for command handlers declared with {@link OnCommand}.
 *
 * @remarks
 * TC39 standard decorators store an `Array<CommandHandlerMetadata>` under this
 * key on the class `Symbol.metadata` object.
 *
 * @group Commands
 * @internal
 */
export const COMMAND_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/command");

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
 * Standard decorator metadata key for the `@OnActivated` method name.
 *
 * @remarks
 * TC39 standard decorators store the decorated method name under this key on
 * the class `Symbol.metadata` object.
 *
 * @group Bind
 * @internal
 */
export const ACTIVATED_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/activated");

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
 * Standard decorator metadata key for the `@OnDeactivation` method name.
 *
 * @remarks
 * TC39 standard decorators store the decorated method name under this key on
 * the class `Symbol.metadata` object.
 *
 * @group Bind
 * @internal
 */
export const DEACTIVATION_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/deactivation");

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
 * Standard decorator metadata key for the `@OnProvision` method name.
 *
 * @remarks
 * TC39 standard decorators store the decorated method name under this key on
 * the class `Symbol.metadata` object.
 *
 * @group Bind
 * @internal
 */
export const PROVISION_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/provision");

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
 * Standard decorator metadata key for the `@OnDeprovision` method name.
 *
 * @remarks
 * TC39 standard decorators store the decorated method name under this key on
 * the class `Symbol.metadata` object.
 *
 * @group Bind
 * @internal
 */
export const DEPROVISION_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/deprovision");

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
 * Standard decorator metadata key for event handlers declared with {@link OnEvent}.
 *
 * @remarks
 * TC39 standard decorators store an `Array<EventHandlerMetadata>` under this
 * key on the class `Symbol.metadata` object.
 *
 * @group Events
 * @internal
 */
export const EVENT_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/event");

/**
 * Internal storage for mapping instances to their originating containers.
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
 * Internal storage for service lifecycle status keyed by instance.
 *
 * @remarks
 * Status survives deactivation while the instance object is still reachable,
 * which lets callers inspect lifecycle state by instance reference.
 *
 * @group Container
 * @internal
 */
export const INSTANCE_STATUSES_BY_INSTANCE: WeakMap<object, WireStatus> = new WeakMap();

/**
 * Internal storage for active service instances keyed by container.
 *
 * @remarks
 * Tracks which resolved instances currently belong to each container so
 * provider lifecycle can eagerly update their stable {@link WireStatus}
 * handles.
 *
 * @group Container
 * @internal
 */
export const ACTIVE_INSTANCES_BY_CONTAINER: WeakMap<Container, Set<object>> = new WeakMap();

/**
 * Internal storage for current provider ownership state keyed by container.
 *
 * @group Container
 * @internal
 */
export const PROVISION_STATUS_BY_CONTAINER: WeakMap<Container, boolean> = new WeakMap();

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
 * Unique symbol used as a token for the container-scoped seeds map.
 *
 * @remarks
 * This token is used to bind and resolve the {@link SeedsMap} in the {@link Container}.
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
 * This token is used to bind and resolve the shared seed object in the {@link Container}.
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
