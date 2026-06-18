import { type ReactiveElement } from "@lit/reactive-element";
import { type CommandHandler, type CommandType } from "@wirestate/core";

import { OnCommandController } from "./on-command-controller";

/**
 * Describes options for {@link useOnCommand}.
 *
 * @group Commands
 */
export interface UseOnCommandOptions<R = unknown, P = unknown, T extends CommandType = CommandType> {
  /**
   * The command type to listen for.
   */
  type: T;
  /**
   * The command handler function.
   */
  handler: CommandHandler<R, P, T>;
}

/**
 * Registers a command handler for the host element's lifetime.
 *
 * @group Commands
 *
 * @param host - Host element.
 * @param options - Command handling options.
 * @param options.type - The command type to listen for.
 * @param options.handler - The command handler function.
 * @returns The command controller instance.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   private onSave = useOnCommand(this, {
 *     type: "SAVE",
 *     handler: (payload) => console.log("Saving:", payload),
 *   });
 * }
 * ```
 */
export function useOnCommand<R = unknown, P = unknown, T extends CommandType = CommandType>(
  host: ReactiveElement,
  { type, handler }: UseOnCommandOptions<R, P, T>
): OnCommandController<R, P, T> {
  return new OnCommandController<R, P, T>(host, type, handler);
}
