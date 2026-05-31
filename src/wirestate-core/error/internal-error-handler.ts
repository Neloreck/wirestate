import { Maybe } from "@wirestate/core/types/general";

import { Container } from "../alias";
import { WIRESTATE_INTERNAL_ERROR_HANDLERS } from "../registry";
import { WireEvent } from "../types/events";

/**
 * Internal Wirestate error source.
 *
 * @group Error
 */
export type WirestateInternalErrorSource =
  | "event-handler"
  | "service-event-handler"
  | "service-activation"
  | "service-deactivation"
  | "provider-provision"
  | "provider-deprovision";

/**
 * Describes an internal error that Wirestate isolates instead of rethrowing.
 *
 * @group Error
 */
export interface InternalErrorDescriptor {
  /**
   * Container that owns the failed internal work.
   */
  readonly container?: Container;

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
   * Service instance that owns the failed handler, when known.
   */
  readonly service?: object;

  /**
   * Service class name, when known.
   */
  readonly serviceName?: string;

  /**
   * Internal subsystem that caught the failure.
   */
  readonly source: WirestateInternalErrorSource;
}

/**
 * Handles isolated internal Wirestate errors.
 *
 * @group Error
 */
export type InternalErrorHandler = (descriptor: InternalErrorDescriptor) => void;

/**
 * Handles internal Wirestate errors with the default console output.
 *
 * @group Error
 *
 * @param descriptor - Internal error descriptor.
 */
export function defaultInternalErrorHandler(descriptor: InternalErrorDescriptor): void {
  console.error(`[wirestate] ${descriptor.message}:`, ...(descriptor.details ?? []), descriptor.error);
}

/**
 * Resolves the configured internal error handler for a container.
 *
 * @internal
 *
 * @param container - Container to inspect.
 * @returns Configured handler, or `undefined` when none is configured.
 */
export function getConfiguredWirestateInternalErrorHandler(container?: Container): Maybe<InternalErrorHandler> {
  return container ? WIRESTATE_INTERNAL_ERROR_HANDLERS.get(container) : null;
}

/**
 * Resolves the handler that should receive internal errors for a container.
 *
 * @internal
 *
 * @param container - Container that owns the failed internal work.
 * @returns Configured handler or the default console handler.
 */
export function getWirestateInternalErrorHandler(container?: Container): InternalErrorHandler {
  return getConfiguredWirestateInternalErrorHandler(container) ?? defaultInternalErrorHandler;
}

/**
 * Stores an internal error handler for a container.
 *
 * @internal
 *
 * @param container - Container that owns the handler.
 * @param handler - Handler to store.
 */
export function setWirestateInternalErrorHandler(container: Container, handler: InternalErrorHandler): void {
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
  const handler: InternalErrorHandler = getWirestateInternalErrorHandler(descriptor.container);

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
