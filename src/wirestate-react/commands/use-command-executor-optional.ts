import { type Container, type CommandType, CommandBus } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";
import { type CommandExecutorOptional } from "../types/commands";
import { type Optional } from "../types/general";

/**
 * Returns a stable function to dispatch optional commands on the active container.
 *
 * @remarks
 * Returns the command result, or `undefined` when no handler is registered
 * instead of throwing. The function is stable while the active container is
 * unchanged. Use {@link useCommandExecutorOptionalAsync} when the result should
 * always be a Promise.
 *
 * @group Commands
 *
 * @returns An optional command executor function.
 *
 * @example
 * ```tsx
 * const executeOptional: CommandExecutorOptional = useCommandExecutorOptional();
 *
 * const onClick = useCallback(() => {
 *   const result: string | undefined = executeOptional("OPTIONAL_COMMAND", payload);
 * }, [payload, executeOptional]);
 * ```
 */
export function useCommandExecutorOptional(): CommandExecutorOptional {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: CommandBus = container.get(CommandBus);

    return <R = unknown, P = unknown, T extends CommandType = CommandType>(type: T, payload?: P): Optional<R> => {
      return bus.executeOptional<R, P, T>(type, payload);
    };
  }, [container]);
}
