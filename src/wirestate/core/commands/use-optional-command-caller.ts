import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { CommandBus } from "@/wirestate/core/commands/command-bus";
import { useContainer } from "@/wirestate/core/provision/use-container";
import { COMMAND_BUS_TOKEN } from "@/wirestate/core/registry";
import type { ICommandDescriptor, TCommandType } from "@/wirestate/types/commands";
import type { Optional } from "@/wirestate/types/general";

/**
 * Returns a function to dispatch optional commands on the active container.
 * Returns null instead of throwing when no handler is registered.
 *
 * @returns optional command dispatcher
 */
export function useOptionalCommandCaller() {
  const container: Container = useContainer();

  return useCallback(
    <R = unknown, D = unknown, T extends TCommandType = TCommandType>(
      type: T,
      data?: D
    ): Optional<ICommandDescriptor<R>> => {
      dbg.info(prefix(__filename), "Optional command:", {
        type,
        data,
      });

      return container.get<CommandBus>(COMMAND_BUS_TOKEN).commandOptional<R, D>(type, data);
    },
    [container]
  );
}
