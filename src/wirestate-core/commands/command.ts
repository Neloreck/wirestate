import { type Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { CommandBus } from "@/wirestate-core/commands/command-bus";
import type { CommandDescriptor, CommandType } from "@/wirestate-core/types/commands";

/**
 * Dispatches a command on the provided container.
 *
 * @param container - inversify container
 * @param type - command type
 * @param data - command data
 * @returns command descriptor
 */
export function command<R = unknown, D = unknown, T extends CommandType = CommandType>(
  container: Container,
  type: T,
  data?: D
): CommandDescriptor<R> {
  dbg.info(prefix(__filename), "Command:", type, data, container);

  return container.get(CommandBus).command<R, D>(type, data);
}
