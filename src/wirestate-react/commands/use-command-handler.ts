import { Container } from "inversify";
import { useEffect, useRef } from "react";

import { CommandBus } from "@/wirestate/core/commands/command-bus";
import { useContainer } from "@/wirestate-react/provision/use-container";
import { COMMAND_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TCommandHandler, TCommandType } from "@/wirestate/types/commands";

/**
 * Registers a command handler for the component's lifetime.
 * The handler is stored in a ref to avoid manual memoization.
 * Only one handler is active per type; newer registrations shadow older ones.
 *
 * @param type - command type
 * @param handler - command handler function
 */
export function useCommandHandler<R = unknown, D = unknown>(type: TCommandType, handler: TCommandHandler<D, R>): void {
  const container: Container = useContainer();
  const handlerRef = useRef<TCommandHandler<D, R>>(handler);

  // Sync ref with the latest closure on every render.
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get<CommandBus>(COMMAND_BUS_TOKEN).register<D, R>(type, (data) => handlerRef.current(data));
  }, [container, type]);
}
