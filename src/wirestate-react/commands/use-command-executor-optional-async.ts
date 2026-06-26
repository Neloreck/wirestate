import { type Container, type CommandType, CommandBus } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";
import { type CommandExecutorOptionalAsync } from "../types/commands";

/**
 * Returns a stable function to dispatch optional commands with Promise-normalized results.
 *
 * @remarks
 * Always returns a Promise that resolves to the command result, or to
 * `undefined` when no handler is registered. The function is stable while the
 * active container is unchanged.
 *
 * @group Commands
 *
 * @returns An optional async command executor function.
 *
 * @example
 * ```tsx
 * const executeOptionalAsync: CommandExecutorOptionalAsync = useCommandExecutorOptionalAsync();
 *
 * const onClick = useCallback(async () => {
 *   const result: string | undefined = await executeOptionalAsync("OPTIONAL_COMMAND", payload);
 * }, [payload, executeOptionalAsync]);
 * ```
 */
export function useCommandExecutorOptionalAsync(): CommandExecutorOptionalAsync {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: CommandBus = container.get(CommandBus);

    return ((type: CommandType, payload?: unknown) => {
      return bus.executeOptionalAsync(type, payload);
    }) as CommandExecutorOptionalAsync;
  }, [container]);
}
