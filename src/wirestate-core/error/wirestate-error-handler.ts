import { type Container } from "../container/container";
import { type WireEvent } from "../plugin/events/events";
import { type Optional } from "../types/general";

/**
 * @remarks
 * Use it to group logs by failure category. It is diagnostic context, not a
 * recovery instruction.
 *
 * @group Error
 */
export type WirestateErrorSource =
  | "event-handler"
  | "instance-event-handler"
  | "instance-activation"
  | "instance-deactivation"
  | "provider-provision"
  | "provider-deprovision";

/**
 * Describes an isolated failure reported through a container error handler.
 *
 * @remarks
 * Carries the original thrown or rejected value plus what Wirestate knew at
 * the catch site. Some fields are present only for specific sources, such as
 * `event` for event handler failures.
 *
 * @group Error
 */
export interface WirestateErrorContext {
  /**
   * Container that owns the failed work, when known.
   */
  readonly container?: Container;

  /**
   * Extra diagnostic values from the failing subsystem.
   */
  readonly details?: ReadonlyArray<unknown>;

  /**
   * Event being dispatched when an event handler failed.
   */
  readonly event?: WireEvent;

  /**
   * Original thrown or rejected value.
   */
  readonly error: unknown;

  /**
   * Human-readable failure summary.
   */
  readonly message: string;

  /**
   * Service method that failed, when known.
   */
  readonly methodName?: string | symbol;

  /**
   * Instance that owns the failed handler, when known.
   */
  readonly instance?: object;

  /**
   * Instance class name, when known.
   */
  readonly instanceName?: string;

  /**
   * Subsystem that caught the failure.
   */
  readonly source: WirestateErrorSource;
}

/**
 * Handles isolated Wirestate errors for a container.
 *
 * @remarks
 * Register it as `new Container({ onError })`. If it throws, Wirestate falls
 * back to {@link defaultWirestateErrorHandler} and reports both failures.
 *
 * @param context - Isolated failure context.
 *
 * @group Error
 */
export type WirestateErrorHandler = (context: WirestateErrorContext) => void;

/**
 * Internal storage for container error handlers.
 */
const WIRESTATE_ERROR_HANDLERS: WeakMap<Container, WirestateErrorHandler> = new WeakMap();

/**
 * Reports isolated Wirestate errors to `console.error`.
 *
 * @remarks
 * This is the fallback used when a container has no `onError` handler, or when
 * a custom handler throws.
 *
 * @group Error
 *
 * @param context - Isolated failure context.
 */
export function defaultWirestateErrorHandler(context: WirestateErrorContext): void {
  console.error(
    `[wirestate] ${context.message}:`,
    {
      source: context.source,
      ...(context.instanceName ? { instanceName: context.instanceName } : {}),
      ...(context.methodName !== undefined ? { methodName: context.methodName } : {}),
      ...(context.event ? { event: context.event } : {}),
    },
    ...(context.details ?? []),
    context.error
  );
}

/**
 * Resolves the configured internal error handler for a container.
 *
 * @internal
 *
 * @param container - Container to inspect.
 * @returns Configured handler, or `undefined` when none is configured.
 */
export function getConfiguredWirestateErrorHandler(container?: Container): Optional<WirestateErrorHandler> {
  return container ? WIRESTATE_ERROR_HANDLERS.get(container) : undefined;
}

/**
 * Stores an internal error handler for a container.
 *
 * @internal
 *
 * @param container - Container that owns the handler.
 * @param handler - Handler to store.
 */
export function setWirestateErrorHandler(container: Container, handler: WirestateErrorHandler): void {
  WIRESTATE_ERROR_HANDLERS.set(container, handler);
}

/**
 * Reports an isolated error and protects against handler failures.
 *
 * @internal
 *
 * @param context - Isolated failure context.
 */
export function reportWirestateError(context: WirestateErrorContext): void {
  const handler: WirestateErrorHandler =
    getConfiguredWirestateErrorHandler(context.container) ?? defaultWirestateErrorHandler;

  try {
    handler(context);
  } catch (handlerError) {
    defaultWirestateErrorHandler(context);
    defaultWirestateErrorHandler({
      error: handlerError,
      message: "Internal error handler threw",
      source: context.source,
    });
  }
}
