import { type Container, type CommandHandler, type CommandType, CommandBus } from "@wirestate/core";
import { useRef } from "react";

import { useContainer } from "../context/use-container";
import { useIsomorphicLayoutEffect } from "../utils/use-isomorphic-layout-effect";

/**
 * Registers a command handler for the component's lifetime.
 *
 * @remarks
 * Only one handler is active per type; the newest registration shadows older
 * ones. The handler is unregistered when the component unmounts or the active
 * container changes, and may change between renders without re-registering.
 *
 * @group Commands
 *
 * @template R - Result type of the command.
 * @template P - Payload type of the command.
 * @template T - Command type.
 *
 * @param type - Command type to handle.
 * @param handler - Function that handles the command and returns its result.
 *
 * @example
 * ```tsx
 * useOnCommand("SAVE_COMMAND", (payload) => {
 *   return api.save(payload);
 * });
 * ```
 */
export function useOnCommand<R = unknown, P = unknown, T extends CommandType = CommandType>(
  type: T,
  handler: CommandHandler<R, P, T>
): void {
  const container: Container = useContainer();
  const handlerRef = useRef<CommandHandler<R, P, T>>(handler);

  // Sync ref with the latest closure on every render.
  useIsomorphicLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useIsomorphicLayoutEffect(() => {
    return container.get(CommandBus).register<R, P, T>(type, (payload) => handlerRef.current(payload));
  }, [container, type]);
}
