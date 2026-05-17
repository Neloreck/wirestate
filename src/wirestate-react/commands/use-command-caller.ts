import { Container, CommandBus, CommandDescriptor, CommandType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { CommandCaller } from "../types/commands";

/**
 * Returns a stable function to dispatch commands on the active container.
 *
 * @remarks
 * The returned dispatcher is memoized using `useCallback` and stays stable
 * for the lifetime of the container. It uses {@link CommandBus.command} internally.
 *
 * @group Commands
 *
 * @returns A command dispatcher function that takes a type and optional data.
 *
 * @example
 * ```tsx
 * const call: CommandCaller = useCommandCaller();
 *
 * const onClick = () => call("SAVE_USER_COMMAND", { id: 1 });
 * ```
 */
export function useCommandCaller(): CommandCaller {
  const container: Container = useContainer();

  return useCallback(
    <R = unknown, D = unknown, T extends CommandType = CommandType>(type: T, data?: D): CommandDescriptor<R> => {
      dbg.info(prefix(__filename), "Command:", {
        type,
        data,
      });

      return container.get(CommandBus).command<R, D>(type, data);
    },
    [container]
  );
}
