import { Container, CommandBus, CommandType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { AsyncCommandExecutor } from "../types/commands";

/**
 * Returns a stable function to dispatch async-capable commands on the active container.
 *
 * @remarks
 * The returned executor is memoized using `useCallback` and stays stable
 * for the lifetime of the container. It uses {@link CommandBus.executeAsync} internally.
 *
 * @group Commands
 *
 * @returns An async command executor function.
 *
 * @example
 * ```tsx
 * const executeCommandAsync: AsyncCommandExecutor = useAsyncCommandExecutor();
 *
 * const onClick = useCallback(async () => {
 *   await executeCommandAsync("SAVE_USER_COMMAND", { id: 1 });
 * }, [executeCommandAsync]);
 * ```
 */
export function useAsyncCommandExecutor(): AsyncCommandExecutor {
  const container: Container = useContainer();

  return useCallback(
    (type: CommandType, data?: unknown) => {
      dbg.info(prefix(__filename), "Async command:", {
        type,
        data,
      });

      return container.get(CommandBus).executeAsync(type, data);
    },
    [container]
  ) as AsyncCommandExecutor;
}
