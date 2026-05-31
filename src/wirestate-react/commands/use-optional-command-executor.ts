import { Container, CommandBus, CommandType } from "@wirestate/core";
import { useMemo } from "react";

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
 * const onClick = useCallback(() => {
 *   const result: string | null = executeOptionalCommand("OPTIONAL_COMMAND", data);
 * }, [data, executeOptionalCommand]);
 * ```
 */
export function useOptionalCommandExecutor(): OptionalCommandExecutor {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: CommandBus = container.get(CommandBus);

    return <R = unknown, D = unknown, T extends CommandType = CommandType>(type: T, data?: D): R | null => {
      dbg.info(prefix(__filename), "Optional command:", {
        type,
        data,
      });

      return bus.executeOptional<R, D>(type, data);
    };
  }, [container]);
}
