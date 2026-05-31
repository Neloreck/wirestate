import { Container, CommandBus, CommandType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { CommandExecutor } from "../types/commands";

/**
 * Returns a stable function to dispatch commands on the active container.
 *
 * @remarks
 * The returned executor is memoized using `useCallback` and stays stable
 * for the lifetime of the container. It uses {@link CommandBus.execute} internally.
 *
 * @group Commands
 *
 * @returns A command executor function that takes a type and optional data.
 *
 * @example
 * ```tsx
 * const executeCommand: CommandExecutor = useCommandExecutor();
 *
 * const onClick = useCallback(() => {
 *   return executeCommand("SAVE_USER_COMMAND", { id: 1 });
 * }, [executeCommand]);
 * ```
 */
export function useCommandExecutor(): CommandExecutor {
  const container: Container = useContainer();

  return useCallback(
    <R = unknown, D = unknown, T extends CommandType = CommandType>(type: T, data?: D): R => {
      dbg.info(prefix(__filename), "Command:", {
        type,
        data,
      });

      return container.get(CommandBus).execute<R, D>(type, data);
    },
    [container]
  );
}
