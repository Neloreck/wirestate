import { CommandDescriptor, CommandType } from "@wirestate/core";

import { Optional } from "./general";

/**
 * Command calling function signature.
 *
 * @group commands
 */
export type CommandCaller = <R = unknown, D = unknown, T extends CommandType = CommandType>(
  type: T,
  data?: D
) => CommandDescriptor<R>;

/**
 * Command calling function signature.
 *
 * @group commands
 */
export type OptionalCommandCaller = <R = unknown, D = unknown, T extends CommandType = CommandType>(
  type: T,
  data?: D
) => Optional<CommandDescriptor<R>>;
