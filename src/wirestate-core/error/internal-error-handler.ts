import { Container } from "../base";
import { WIRESTATE_INTERNAL_ERROR_HANDLERS } from "../registry";
import { InternalErrorDescriptor, InternalErrorHandler } from "../types/error";
import { Maybe } from "../types/general";

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
 * @param container - Container to inspect.
 * @returns Configured handler, or `undefined` when none is configured.
 */
export function getConfiguredInternalErrorHandler(container?: Container): Maybe<InternalErrorHandler> {
  return container ? WIRESTATE_INTERNAL_ERROR_HANDLERS.get(container) : null;
}

/**
 * Stores an internal error handler for a container.
 *
 * @internal
 *
 * @param container - Container that owns the handler.
 * @param handler - Handler to store.
 */
export function setInternalErrorHandler(container: Container, handler: InternalErrorHandler): void {
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
