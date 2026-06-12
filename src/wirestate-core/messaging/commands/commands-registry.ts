import type { CommandHandlerMetadata } from "./commands";

/**
 * Registry of class constructors to their declared command handlers.
 *
 * @remarks
 * Populated by the {@link OnCommand} decorator in legacy experimental mode.
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
