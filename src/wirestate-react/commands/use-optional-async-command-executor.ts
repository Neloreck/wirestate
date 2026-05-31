import { Container, CommandBus, CommandType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { OptionalAsyncCommandExecutor } from "../types/commands";

/**
 * Returns a stable function to dispatch optional async commands on the active container.
 *
 * @remarks
 * Similar to {@link useAsyncCommandExecutor}, but resolves to `null` instead of
 * rejecting with {WirestateError} if no handler is registered for the command type.
 *
 * @group Commands
 *
 * @returns An optional async command executor function.
 *
 * @example
 * ```tsx
 * const executeOptionalCommandAsync: OptionalAsyncCommandExecutor = useOptionalAsyncCommandExecutor();
 *
 * const onClick = useCallback(async () => {
 *   const result: string | null = await executeOptionalCommandAsync("OPTIONAL_COMMAND", data);
 * }, [data, executeOptionalCommandAsync]);
 * ```
 */
export function useOptionalAsyncCommandExecutor(): OptionalAsyncCommandExecutor {
  const container: Container = useContainer();

  return useCallback(
    (type: CommandType, data?: unknown) => {
      dbg.info(prefix(__filename), "Optional async command:", {
        type,
        data,
      });

      return container.get(CommandBus).executeOptionalAsync(type, data);
    },
    [container]
  ) as OptionalAsyncCommandExecutor;
}
