import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { CommandBus } from "@/wirestate/core/commands/command-bus";
import { useContainer } from "@/wirestate/core/provision/use-container";
import { COMMAND_BUS_TOKEN } from "@/wirestate/core/registry";
import type { ICommandDescriptor, TCommandType } from "@/wirestate/types/commands";

/**
 * Returns a function to dispatch commands on the active container.
 *
 * @returns command dispatcher
 */
export function useCommandCaller() {
  const container: Container = useContainer();

  return useCallback(
    <R = unknown, D = unknown, T extends TCommandType = TCommandType>(type: T, data?: D): ICommandDescriptor<R> => {
      dbg.info(prefix(__filename), "Command:", {
        type,
        data,
      });

      return container.get<CommandBus>(COMMAND_BUS_TOKEN).command<R, D>(type, data);
    },
    [container]
  );
}
