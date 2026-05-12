import { ReactiveElement } from "@lit/reactive-element";
import { CommandHandler, CommandType } from "@wirestate/core";

import { OnCommandController } from "./on-command-controller";

/**
 * Represents options for the {@link useOnCommand} hook.
 *
 * @group Commands
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
 * Hook that registers a command handler for the host element's lifetime.
 *
 * @group Commands
 *
 * @param host - The host element.
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
