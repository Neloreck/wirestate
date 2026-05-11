import { Container, CommandBus, CommandDescriptor, CommandType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../provision/use-container";
import { OptionalCommandCaller } from "../types/commands";

/**
 * Returns a stable function to dispatch optional commands on the active container.
 *
 * @remarks
 * Similar to {@link useCommandCaller}, but returns `null` instead of throwing
 * {WirestateError} if no handler is registered for the command type.
 * Uses {@link CommandBus.commandOptional} internally.
 *
 * @group Commands
 *
 * @returns An optional command dispatcher function.
 *
 * @example
 * ```tsx
 * const callOptional: OptionalCommandCaller = useOptionalCommandCaller();
 * const descriptor: CommandDescriptor<string> | null = callOptional("OPTIONAL_COMMAND", data);
 *
 * if (descriptor) {
 *   const result: string = await descriptor.task;
 * }
 * ```
 */
export function useOptionalCommandCaller(): OptionalCommandCaller {
  const container: Container = useContainer();

  return useCallback(
    <R = unknown, D = unknown, T extends CommandType = CommandType>(type: T, data?: D): CommandDescriptor<R> | null => {
      dbg.info(prefix(__filename), "Optional command:", {
        type,
        data,
      });

      return container.get(CommandBus).commandOptional<R, D>(type, data);
    },
    [container]
  );
}
