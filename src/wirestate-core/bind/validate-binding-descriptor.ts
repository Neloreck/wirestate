import { BindingScope as BindingScopeValues, BindingType as BindingTypeValues } from "../alias";
import { ERROR_CODE_INVALID_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { BindingType, BindingScope } from "../types/provision";

interface UnsafeBindingDescriptor {
  readonly type?: unknown;
  readonly scope?: unknown;
  readonly token?: unknown;
}

/**
 * Validates descriptor fields shared by all binding strategies.
 *
 * @group Bind
 * @internal
 *
 * @param binding - Descriptor to validate.
 *
 * @throws {@link WirestateError} If required shared descriptor fields are invalid.
 */
export function validateBindingDescriptor(binding: UnsafeBindingDescriptor): void {
  if (
    !Object.prototype.hasOwnProperty.call(binding, "token") ||
    binding.token === undefined ||
    binding.token === null
  ) {
    throw new WirestateError("Binding descriptor must provide a 'token' property.", ERROR_CODE_INVALID_ARGUMENTS);
  }

  if (binding.type !== undefined && !Object.values(BindingTypeValues).includes(binding.type as BindingType)) {
    throw new WirestateError(
      `Binding descriptor has unknown type '${String(binding.type)}'.`,
      ERROR_CODE_INVALID_ARGUMENTS
    );
  }

  if (binding.scope !== undefined && !Object.values(BindingScopeValues).includes(binding.scope as BindingScope)) {
    throw new WirestateError(
      `Binding descriptor has unknown scope '${String(binding.scope)}'.`,
      ERROR_CODE_INVALID_BINDING_SCOPE
    );
  }
}
