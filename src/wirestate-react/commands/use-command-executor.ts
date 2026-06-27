import { type CommandDispatchOptions, type Container, type CommandType, CommandBus } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";

import { type CommandExecutor } from "./commands";

/**
 * Returns a stable function to dispatch commands on the active container.
 *
 * @remarks
 * Returns the command result synchronously and throws when no handler is
 * registered. The function is stable while the active container is unchanged, so
 * it is safe to use as an effect or callback dependency. Use
 * {@link useCommandExecutorAsync} when the result should always be a Promise.
 * Pass `{ optional: true }` per dispatch when a missing handler is valid.
 *
 * @group Commands
 *
 * @returns A command executor function that takes a type and optional payload.
 *
 * @example
 * ```tsx
 * const execute: CommandExecutor = useCommandExecutor();
 *
 * const onClick = useCallback(() => {
 *   return execute("SAVE_USER_COMMAND", { id: 1 });
 * }, [execute]);
 * ```
 */
export function useCommandExecutor(): CommandExecutor {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: CommandBus = container.get(CommandBus);

    return ((type: CommandType, payload?: unknown, options?: CommandDispatchOptions) => {
      return bus.execute(type, payload, options);
    }) as CommandExecutor;
  }, [container]);
}
