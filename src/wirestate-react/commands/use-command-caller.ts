import { Container, CommandBus, CommandDescriptor, CommandType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../provision/use-container";

/**
 * Returns a function to dispatch commands on the active container.
 *
 * @group commands
 *
 * @returns Command dispatcher.
 */
export function useCommandCaller() {
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
