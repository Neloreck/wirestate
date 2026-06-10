import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { collectHandlerMetadata } from "../metadata/handler-metadata";
import { COMMAND_HANDLER_METADATA, COMMAND_METADATA_KEY } from "../registry";
import { CommandHandlerMetadata } from "../types/commands";

/**
 * Retrieves `@OnCommand` metadata from the class hierarchy.
 *
 * @remarks
 * Traverses the prototype chain to collect all command handlers.
 * Returns metadata ordered from base class to derived class to ensure parent-first execution.
 *
 * @group Commands
 * @internal
 *
 * @param instance - The instance to inspect.
 * @returns A read-only array of metadata for all discovered command handlers.
 */
export function getCommandHandlerMetadata(instance: object): ReadonlyArray<CommandHandlerMetadata> {
  dbg.info(prefix(__filename), "Resolving instance command metadata:", {
    name: instance.constructor.name,
    instance,
  });

  return collectHandlerMetadata(instance, COMMAND_HANDLER_METADATA, COMMAND_METADATA_KEY);
}
