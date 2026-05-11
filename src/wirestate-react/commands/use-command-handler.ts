import { Container, CommandBus, CommandHandler, CommandType } from "@wirestate/core";
import { useEffect, useRef } from "react";

import { useContainer } from "../provision/use-container";

/**
 * Registers a command handler for the component's lifetime.
 *
 * @remarks
 * The handler is stored in a `useRef` and synced on every render to avoid stale
 * closures without requiring manual memoization of the handler function.
 * Only one handler is active per type; newer registrations shadow older ones.
 * The handler is automatically unregistered when the component unmounts.
 *
 * @group Commands
 *
 * @template R - Result type of the command.
 * @template D - Data/payload type of the command.
 *
 * @param type - Command type (string or symbol).
 * @param handler - Command handler function.
 *
 * @example
 * ```tsx
 * useCommandHandler("SAVE_COMMAND", (data) => {
 *   return api.save(data);
 * });
 * ```
 */
export function useCommandHandler<R = unknown, D = unknown>(type: CommandType, handler: CommandHandler<D, R>): void {
  const container: Container = useContainer();
  const handlerRef = useRef<CommandHandler<D, R>>(handler);

  // Sync ref with the latest closure on every render.
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get(CommandBus).register<D, R>(type, (data) => handlerRef.current(data));
  }, [container, type]);
}
