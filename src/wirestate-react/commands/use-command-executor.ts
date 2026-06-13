import { Container, CommandBus, CommandType } from "@wirestate/core";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { CommandExecutor } from "../types/commands";

/**
 * Returns a stable function to dispatch commands on the active container.
 *
 * @remarks
 * The returned executor is memoized using `useMemo` and stays stable
 * for the lifetime of the container. It uses {@link CommandBus.execute} internally.
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

    return <R = unknown, P = unknown, T extends CommandType = CommandType>(type: T, payload?: P): R => {
      dbg.info(prefix(__filename), "Command:", {
        type,
        payload,
      });

      return bus.execute<R, P, T>(type, payload);
    };
  }, [container]);
}
