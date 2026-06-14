import type { ContainerKernel } from "../container/container-kernel";
import type { WireEvent } from "../plugin/events/events";
import type { Maybe } from "../types/general";

/**
 * Internal Wirestate error source.
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
 * Describes an internal error that Wirestate isolates instead of rethrowing.
 *
 * @group Error
 */
export interface InternalErrorDescriptor {
  /**
   * ContainerKernel that owns the failed internal work.
   */
  readonly container?: ContainerKernel;

  /**
   * Extra values printed between the message and error by the default handler.
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
   * Message printed after the `[wirestate]` prefix by the default handler.
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
   * Internal subsystem that caught the failure.
   */
  readonly source: InternalErrorSource;
}

/**
 * Handles isolated internal Wirestate errors.
 *
 * @group Error
 */
export type InternalErrorHandler = (descriptor: InternalErrorDescriptor) => void;

/**
 * Internal storage for container error handlers.
 */
const WIRESTATE_INTERNAL_ERROR_HANDLERS: WeakMap<ContainerKernel, InternalErrorHandler> = new WeakMap();

/**
 * Handles internal Wirestate errors with the default console output.
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
