import { type ContainerKernel } from "../container/container-kernel";
import { type WireEvent } from "../plugin/events/events";
import { type Maybe } from "../types/general";

/**
 * @remarks
 * Use it to group logs by failure category. It is diagnostic context, not a
 * recovery instruction.
 *
 * @group Error
 */
export type InternalErrorSource =
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
 * The descriptor carries the original thrown or rejected value plus the
 * Wirestate context known at the catch site. Some fields are present only for
 * specific sources, such as `event` for event handler failures.
 *
 * @group Error
 */
export interface InternalErrorDescriptor {
  /**
   * Container that owns the failed work, when known.
   */
  readonly container?: ContainerKernel;

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
  readonly source: InternalErrorSource;
}

/**
 * Handles isolated Wirestate errors for a container.
 *
 * @remarks
 * Register it as `new Container({ onError })`. If it throws, Wirestate falls
 * back to {@link defaultInternalErrorHandler} and reports both failures.
 *
 * @param descriptor - Isolated failure descriptor.
 *
 * @group Error
 */
export type InternalErrorHandler = (descriptor: InternalErrorDescriptor) => void;

/**
 * Internal storage for container error handlers.
 */
const WIRESTATE_INTERNAL_ERROR_HANDLERS: WeakMap<ContainerKernel, InternalErrorHandler> = new WeakMap();

/**
 * Reports isolated Wirestate errors to `console.error`.
 *
 * @remarks
 * This is the fallback used when a container has no `onError` handler, or when
 * a custom handler throws.
 *
 * @group Error
 *
 * @param descriptor - Internal error descriptor.
 */
export function defaultInternalErrorHandler(descriptor: InternalErrorDescriptor): void {
  console.error(
    `[wirestate] ${descriptor.message}:`,
    {
      source: descriptor.source,
      ...(descriptor.instanceName ? { instanceName: descriptor.instanceName } : {}),
      ...(descriptor.methodName !== undefined ? { methodName: descriptor.methodName } : {}),
      ...(descriptor.event ? { event: descriptor.event } : {}),
    },
    ...(descriptor.details ?? []),
    descriptor.error
  );
}

/**
 * Resolves the configured internal error handler for a container.
 *
 * @internal
 *
 * @param container - ContainerKernel to inspect.
 * @returns Configured handler, or `undefined` when none is configured.
 */
export function getConfiguredInternalErrorHandler(container?: ContainerKernel): Maybe<InternalErrorHandler> {
  return container ? WIRESTATE_INTERNAL_ERROR_HANDLERS.get(container) : null;
}

/**
 * Stores an internal error handler for a container.
 *
 * @internal
 *
 * @param container - ContainerKernel that owns the handler.
 * @param handler - Handler to store.
 */
export function setInternalErrorHandler(container: ContainerKernel, handler: InternalErrorHandler): void {
  WIRESTATE_INTERNAL_ERROR_HANDLERS.set(container, handler);
}

/**
 * Reports an isolated internal error and protects against handler failures.
 *
 * @internal
 *
 * @param descriptor - Internal error descriptor.
 */
export function reportWirestateInternalError(descriptor: InternalErrorDescriptor): void {
  const handler: InternalErrorHandler =
    getConfiguredInternalErrorHandler(descriptor.container) ?? defaultInternalErrorHandler;

  try {
    handler(descriptor);
  } catch (handlerError) {
    defaultInternalErrorHandler(descriptor);
    defaultInternalErrorHandler({
      error: handlerError,
      message: "Internal error handler threw",
      source: descriptor.source,
    });
  }
}
