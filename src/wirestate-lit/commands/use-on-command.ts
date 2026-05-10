import { ReactiveElement } from "@lit/reactive-element";
import { CommandHandler, CommandType } from "@wirestate/core";

import { OnCommandController } from "./on-command-controller";

/**
 * Options for the {@link useOnCommand} hook.
 *
 * @group commands
 */
export interface UseOnCommandOptions<D = unknown, R = unknown> {
  /**
   * The command type to listen for.
   */
  type: CommandType;
  /**
   * The command handler function.
   */
  handler: CommandHandler<D, R>;
}

/**
 * Registers a command handler on the CommandBus for the host element's lifetime.
 *
 * @group commands
 *
 * @param host - the host element
 * @param options - command handling options
 * @param options.type - the command type to listen for
 * @param options.handler - the command handler function
 * @returns the command controller instance
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   private onSave = useOnCommand(this, {
 *     type: "SAVE",
 *     handler: (data) => console.log("Saving:", data),
 *   });
 * }
 * ```
 */
export function useOnCommand<D = unknown, R = unknown>(
  host: ReactiveElement,
  { type, handler }: UseOnCommandOptions<D, R>
): OnCommandController<D, R> {
  return new OnCommandController<D, R>(host, type, handler);
}
