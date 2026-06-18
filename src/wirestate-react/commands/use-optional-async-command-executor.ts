import { type Container, type CommandType, CommandBus } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";
import { type OptionalAsyncCommandExecutor } from "../types/commands";

/**
 * Returns a stable function to dispatch optional commands with Promise-normalized results.
 *
 * @remarks
 * Similar to {@link useAsyncCommandExecutor}, but resolves to `undefined` instead of
 * rejecting with `WirestateError` if no handler is registered for the command type.
 *
 * @group Commands
 *
 * @returns An optional async command executor function.
 *
 * @example
 * ```tsx
 * const executeOptionalAsync: OptionalAsyncCommandExecutor = useOptionalAsyncCommandExecutor();
 *
 * const onClick = useCallback(async () => {
 *   const result: string | undefined = await executeOptionalAsync("OPTIONAL_COMMAND", payload);
 * }, [payload, executeOptionalAsync]);
 * ```
 */
export function useOptionalAsyncCommandExecutor(): OptionalAsyncCommandExecutor {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: CommandBus = container.get(CommandBus);

    return ((type: CommandType, payload?: unknown) => {
      return bus.executeOptionalAsync(type, payload);
    }) as OptionalAsyncCommandExecutor;
  }, [container]);
}
