import { type Container, type CommandType, CommandBus } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";
import { type CommandExecutorAsync } from "../types/commands";

/**
 * Returns a stable function to dispatch commands with Promise-normalized results.
 *
 * @remarks
 * Always returns a Promise, whether the handler is synchronous or asynchronous,
 * so callers can `await` the result without checking. The function is stable
 * while the active container is unchanged.
 *
 * @group Commands
 *
 * @returns An async command executor function.
 *
 * @example
 * ```tsx
 * const executeAsync: CommandExecutorAsync = useCommandExecutorAsync();
 *
 * const onClick = useCallback(async () => {
 *   await executeAsync("SAVE_USER_COMMAND", { id: 1 });
 * }, [executeAsync]);
 * ```
 */
export function useCommandExecutorAsync(): CommandExecutorAsync {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: CommandBus = container.get(CommandBus);

    return ((type: CommandType, payload?: unknown) => {
      return bus.executeAsync(type, payload);
    }) as CommandExecutorAsync;
  }, [container]);
}
