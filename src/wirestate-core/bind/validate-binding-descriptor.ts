import { BindingType as Binding, ScopeBindingType as ScopeBinding } from "../alias";
import { ERROR_CODE_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { BindingType, ScopeBindingType } from "../types/provision";

interface UnsafeBindingDescriptor {
  readonly bindingType?: unknown;
  readonly id?: unknown;
  readonly scopeBindingType?: unknown;
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
  if (!Object.prototype.hasOwnProperty.call(binding, "id") || binding.id === undefined || binding.id === null) {
    throw new WirestateError(ERROR_CODE_INVALID_ARGUMENTS, "Binding descriptor must provide an 'id' token.");
  }

  if (binding.bindingType !== undefined && !Object.values(Binding).includes(binding.bindingType as BindingType)) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `Binding descriptor has unknown binding type '${String(binding.bindingType)}'.`
    );
  }

  if (
    binding.scopeBindingType !== undefined &&
    !Object.values(ScopeBinding).includes(binding.scopeBindingType as ScopeBindingType)
  ) {
    throw new WirestateError(
      ERROR_CODE_BINDING_SCOPE,
      `Binding descriptor has unknown scope binding type '${String(binding.scopeBindingType)}'.`
    );
  }
}
