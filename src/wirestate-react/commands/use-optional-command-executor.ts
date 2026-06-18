import { type Container, type CommandType, CommandBus } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";
import { type OptionalCommandExecutor } from "../types/commands";
import { type Optional } from "../types/general";

/**
 * Returns a stable function to dispatch optional commands on the active container.
 *
 * @remarks
 * Similar to {@link useCommandExecutor}, but returns `undefined` instead of throwing
 * `WirestateError` if no handler is registered for the command type.
 * Uses {@link CommandBus.executeOptional} internally.
 *
 * @group Commands
 *
 * @returns An optional command executor function.
 *
 * @example
 * ```tsx
 * const executeOptional: OptionalCommandExecutor = useOptionalCommandExecutor();
 *
 * const onClick = useCallback(() => {
 *   const result: string | undefined = executeOptional("OPTIONAL_COMMAND", payload);
 * }, [payload, executeOptional]);
 * ```
 */
export function useOptionalCommandExecutor(): OptionalCommandExecutor {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: CommandBus = container.get(CommandBus);

    return <R = unknown, P = unknown, T extends CommandType = CommandType>(type: T, payload?: P): Optional<R> => {
      return bus.executeOptional<R, P, T>(type, payload);
    };
  }, [container]);
}
