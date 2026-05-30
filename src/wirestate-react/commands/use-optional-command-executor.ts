import { Container, CommandBus, CommandExecution, CommandType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { OptionalCommandExecutor } from "../types/commands";

/**
 * Returns a stable function to dispatch optional commands on the active container.
 *
 * @remarks
 * Similar to {@link useCommandExecutor}, but returns `null` instead of throwing
 * {WirestateError} if no handler is registered for the command type.
 * Uses {@link CommandBus.executeOptional} internally.
 *
 * @group Commands
 *
 * @returns An optional command executor function.
 *
 * @example
 * ```tsx
 * const executeOptionalCommand: OptionalCommandExecutor = useOptionalCommandExecutor();
 *
 * const onClick = useCallback(async () => {
 *   const execution: CommandExecution<string> | null = executeOptionalCommand("OPTIONAL_COMMAND", data);
 *
 *   if (execution) {
 *     const result: string = await execution.result;
 *   }
 * }, [data, executeOptionalCommand]);
 * ```
 */
export function useOptionalCommandExecutor(): OptionalCommandExecutor {
  const container: Container = useContainer();

  return useCallback(
    <R = unknown, D = unknown, T extends CommandType = CommandType>(type: T, data?: D): CommandExecution<R> | null => {
      dbg.info(prefix(__filename), "Optional command:", {
        type,
        data,
      });

      return container.get(CommandBus).executeOptional<R, D>(type, data);
    },
    [container]
  );
}
