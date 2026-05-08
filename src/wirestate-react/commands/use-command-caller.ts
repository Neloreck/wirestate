import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { CommandBus, COMMAND_BUS, CommandDescriptor, CommandType } from "@/wirestate-core";
import { useContainer } from "@/wirestate-react/provision/use-container";

/**
 * Returns a function to dispatch commands on the active container.
 *
 * @returns command dispatcher
 */
export function useCommandCaller() {
  const container: Container = useContainer();

  return useCallback(
    <R = unknown, D = unknown, T extends CommandType = CommandType>(type: T, data?: D): CommandDescriptor<R> => {
      dbg.info(prefix(__filename), "Command:", {
        type,
        data,
      });

      return container.get<CommandBus>(COMMAND_BUS).command<R, D>(type, data);
    },
    [container]
  );
}
