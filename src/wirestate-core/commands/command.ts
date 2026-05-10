import { type Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import type { CommandDescriptor, CommandType } from "../types/commands";

import { CommandBus } from "./command-bus";

/**
 * Dispatches a command on the provided container.
 *
 * @group commands
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
