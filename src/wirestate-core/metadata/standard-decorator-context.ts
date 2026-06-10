import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";

/**
 * Validates a TC39 standard method decorator context for Wirestate decorators.
 *
 * @remarks
 * Wirestate method decorators only support public instance methods: metadata
 * is read back via public lookups on resolved instances, so fields, static
 * methods, and private methods are rejected. The context's `metadata` object
 * must be defined, which requires `Symbol.metadata` (or its polyfill) to be
 * installed before the decorated class is defined.
 *
 * @group Metadata
 * @internal
 *
 * @param decoratorName - Decorator name used in diagnostics, for example `OnEvent`.
 * @param context - Standard decorator context supplied by the runtime.
 * @returns The validated decorator metadata object of the class being defined.
 *
 * @throws {@link WirestateError}
 * When the decorated member is not a public instance method or when decorator
 * metadata is unavailable.
 */
export function validateStandardMethodContext(
  decoratorName: string,
  context: ClassMethodDecoratorContext
): DecoratorMetadataObject {
  if (context.kind !== "method") {
    throw new WirestateError(`@${decoratorName}() can only decorate class methods.`, ERROR_CODE_VALIDATION_ERROR);
  }

  if (context.static) {
    throw new WirestateError(`@${decoratorName}() cannot decorate static methods.`, ERROR_CODE_VALIDATION_ERROR);
  }

  if (context.private) {
    throw new WirestateError(`@${decoratorName}() cannot decorate private methods.`, ERROR_CODE_VALIDATION_ERROR);
  }

  if (!context.metadata) {
    throw new WirestateError(
      `@${decoratorName}() requires decorator metadata support, but 'Symbol.metadata' is undefined. ` +
        "Import '@wirestate/core' before declaring decorated classes so its Symbol.metadata polyfill is installed.",
      ERROR_CODE_VALIDATION_ERROR
    );
  }

  return context.metadata;
}
