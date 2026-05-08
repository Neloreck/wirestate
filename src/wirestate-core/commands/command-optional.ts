import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { CommandBus } from "@/wirestate-core/commands/command-bus";
import type { CommandDescriptor, CommandType } from "@/wirestate-core/types/commands";
import type { Optional } from "@/wirestate-core/types/general";

/**
 * Dispatches a command on the provided container, returning null if no handler is registered.
 *
 * @param container - inversify container
 * @param type - command type
 * @param data - command data
 * @returns command descriptor or null
 */
export function commandOptional<R = unknown, D = unknown, T extends CommandType = CommandType>(
  container: Container,
  type: T,
  data?: D
): Optional<CommandDescriptor<R>> {
  dbg.info(prefix(__filename), "Optional command:", type, data, container);

  return container.get(CommandBus).commandOptional<R, D>(type, data);
}
