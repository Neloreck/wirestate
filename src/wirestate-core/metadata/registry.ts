// Install the Symbol.metadata polyfill before any consumer class definition.
import "./symbol-metadata";

import type { CommandHandlerMetadata } from "../types/commands";
import type { EventHandlerMetadata } from "../types/events";
import type { QueryHandlerMetadata } from "../types/queries";

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
