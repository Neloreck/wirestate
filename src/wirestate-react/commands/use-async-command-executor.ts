import { Container, CommandBus, CommandType } from "@wirestate/core";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { AsyncCommandExecutor } from "../types/commands";

/**
 * Returns a stable function to dispatch commands with Promise-normalized results.
 *
 * @remarks
 * The returned executor is memoized using `useMemo` and stays stable
 * for the lifetime of the container. It uses {@link CommandBus.executeAsync} internally.
 *
 * @group Commands
 *
 * @returns An async command executor function.
 *
 * @example
 * ```tsx
 * const executeAsync: AsyncCommandExecutor = useAsyncCommandExecutor();
 *
 * const onClick = useCallback(async () => {
 *   await executeAsync("SAVE_USER_COMMAND", { id: 1 });
 * }, [executeAsync]);
 * ```
 */
export function useAsyncCommandExecutor(): AsyncCommandExecutor {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: CommandBus = container.get(CommandBus);

    return ((type: CommandType, payload?: unknown) => {
      dbg.info(prefix(__filename), "Async command:", {
        type,
        payload,
      });

      return bus.executeAsync(type, payload);
    }) as AsyncCommandExecutor;
  }, [container]);
}
