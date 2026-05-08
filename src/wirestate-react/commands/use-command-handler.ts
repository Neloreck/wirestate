import { Container } from "inversify";
import { useEffect, useRef } from "react";

import { COMMAND_BUS, CommandBus, CommandHandler, CommandType } from "@/wirestate";
import { useContainer } from "@/wirestate-react/provision/use-container";

/**
 * Registers a command handler for the component's lifetime.
 * The handler is stored in a ref to avoid manual memoization.
 * Only one handler is active per type; newer registrations shadow older ones.
 *
 * @param type - command type
 * @param handler - command handler function
 */
export function useCommandHandler<R = unknown, D = unknown>(type: CommandType, handler: CommandHandler<D, R>): void {
  const container: Container = useContainer();
  const handlerRef = useRef<CommandHandler<D, R>>(handler);

  // Sync ref with the latest closure on every render.
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get<CommandBus>(COMMAND_BUS).register<D, R>(type, (data) => handlerRef.current(data));
  }, [container, type]);
}
