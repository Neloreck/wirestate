/**
 * Registry of class constructors to their `@OnActivated`-decorated method name.
 *
 * @group Lifecycle
 * @internal
 */
export const ACTIVATED_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Standard decorator metadata key for the `@OnActivated` method name.
 *
 * @group Lifecycle
 * @internal
 */
export const ACTIVATED_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/activated");

/**
 * Registry of class constructors to their `@OnDeactivation`-decorated method name.
 *
 * @group Lifecycle
 * @internal
 */
export const DEACTIVATION_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Standard decorator metadata key for the `@OnDeactivation` method name.
 *
 * @group Lifecycle
 * @internal
 */
export const DEACTIVATION_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/deactivation");

/**
 * Registry of class constructors to their `@OnProvision`-decorated method name.
 *
 * @group Lifecycle
 * @internal
 */
export const PROVISION_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Standard decorator metadata key for the `@OnProvision` method name.
 *
 * @group Lifecycle
 * @internal
 */
export const PROVISION_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/provision");

/**
 * Registry of class constructors to their `@OnDeprovision`-decorated method name.
 *
 * @group Lifecycle
 * @internal
 */
export const DEPROVISION_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Standard decorator metadata key for the `@OnDeprovision` method name.
 *
 * @group Lifecycle
 * @internal
 */
export const DEPROVISION_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/deprovision");
