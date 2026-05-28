import { BindingType, ScopeBindingType } from "../alias";
import { ERROR_CODE_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { BindingDescriptor } from "../types/provision";

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
export function validateBindingDescriptor(binding: BindingDescriptor): void {
  if (!Object.prototype.hasOwnProperty.call(binding, "id") || binding.id === undefined || binding.id === null) {
    throw new WirestateError(ERROR_CODE_INVALID_ARGUMENTS, "Binding descriptor must provide an 'id' token.");
  }

  if (binding.bindingType !== undefined && !Object.values(BindingType).includes(binding.bindingType)) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `Binding descriptor has unknown binding type '${String(binding.bindingType)}'.`
    );
  }

  if (binding.scopeBindingType !== undefined && !Object.values(ScopeBindingType).includes(binding.scopeBindingType)) {
    throw new WirestateError(
      ERROR_CODE_BINDING_SCOPE,
      `Binding descriptor has unknown scope binding type '${String(binding.scopeBindingType)}'.`
    );
  }
}
