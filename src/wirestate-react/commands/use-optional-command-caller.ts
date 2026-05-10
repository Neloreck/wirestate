import { Container, CommandBus, CommandDescriptor, CommandType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../provision/use-container";

/**
 * Returns a function to dispatch optional commands on the active container.
 * Returns null instead of throwing when no handler is registered.
 *
 * @group commands
 *
 * @returns Optional command dispatcher.
 */
export function useOptionalCommandCaller() {
  const container: Container = useContainer();

  return useCallback(
    <R = unknown, D = unknown, T extends CommandType = CommandType>(type: T, data?: D): CommandDescriptor<R> | null => {
      dbg.info(prefix(__filename), "Optional command:", {
        type,
        data,
      });

      return container.get(CommandBus).commandOptional<R, D>(type, data);
    },
    [container]
  );
}
