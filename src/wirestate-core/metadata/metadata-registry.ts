// Install the Symbol.metadata polyfill before any consumer class definition.
import "./metadata-symbol";

import type { CommandHandlerMetadata } from "../messaging/commands/commands";
import type { EventHandlerMetadata } from "../messaging/events/events";
import type { QueryHandlerMetadata } from "../messaging/queries/queries";

/**
 * Registry of class constructors to their declared query handlers.
 *
 * @group Queries
 * @internal
 */
export const QUERY_HANDLER_METADATA: WeakMap<object, Array<QueryHandlerMetadata>> = new WeakMap();

/**
 * Standard decorator metadata key for query handlers declared with {@link OnQuery}.
 *
 * @group Queries
 * @internal
 */
export const QUERY_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/query");

/**
 * Registry of class constructors to their declared command handlers.
 *
 * @group Commands
 * @internal
 */
export const COMMAND_HANDLER_METADATA: WeakMap<object, Array<CommandHandlerMetadata>> = new WeakMap();

/**
 * Standard decorator metadata key for command handlers declared with {@link OnCommand}.
 *
 * @group Commands
 * @internal
 */
export const COMMAND_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/command");

/**
 * Registry of class constructors to their `@OnActivated`-decorated method name.
 *
 * @group Bind
 * @internal
 */
export const ACTIVATED_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Standard decorator metadata key for the `@OnActivated` method name.
 *
 * @group Bind
 * @internal
 */
export const ACTIVATED_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/activated");

/**
 * Registry of class constructors to their `@OnDeactivation`-decorated method name.
 *
 * @group Bind
 * @internal
 */
export const DEACTIVATION_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Standard decorator metadata key for the `@OnDeactivation` method name.
 *
 * @group Bind
 * @internal
 */
export const DEACTIVATION_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/deactivation");

/**
 * Registry of class constructors to their `@OnProvision`-decorated method name.
 *
 * @group Bind
 * @internal
 */
export const PROVISION_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Standard decorator metadata key for the `@OnProvision` method name.
 *
 * @group Bind
 * @internal
 */
export const PROVISION_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/provision");

/**
 * Registry of class constructors to their `@OnDeprovision`-decorated method name.
 *
 * @group Bind
 * @internal
 */
export const DEPROVISION_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Standard decorator metadata key for the `@OnDeprovision` method name.
 *
 * @group Bind
 * @internal
 */
export const DEPROVISION_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/deprovision");

/**
 * Registry of class constructors to their declared event handlers.
 *
 * @group Events
 * @internal
 */
export const EVENT_HANDLER_METADATA: WeakMap<object, Array<EventHandlerMetadata>> = new WeakMap();

/**
 * Standard decorator metadata key for event handlers declared with {@link OnEvent}.
 *
 * @group Events
 * @internal
 */
export const EVENT_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/event");
