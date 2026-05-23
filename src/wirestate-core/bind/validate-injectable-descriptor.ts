import { bindingScopeValues, bindingTypeValues } from "inversify";

import { ERROR_CODE_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { InjectableDescriptor } from "../types/provision";

/**
 * Validates descriptor fields shared by all binding strategies.
 *
 * @group Bind
 * @internal
 *
 * @param entry - Descriptor to validate.
 *
 * @throws {@link WirestateError} If required shared descriptor fields are invalid.
 */
export function validateInjectableDescriptor(entry: InjectableDescriptor): void {
  if (!Object.prototype.hasOwnProperty.call(entry, "id") || entry.id === undefined || entry.id === null) {
    throw new WirestateError(ERROR_CODE_INVALID_ARGUMENTS, "Injectable descriptor must provide an 'id' token.");
  }

  if (entry.bindingType !== undefined && !Object.values(bindingTypeValues).includes(entry.bindingType)) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `Injectable descriptor has unknown binding type '${String(entry.bindingType)}'.`
    );
  }

  if (entry.scopeBindingType !== undefined && !Object.values(bindingScopeValues).includes(entry.scopeBindingType)) {
    throw new WirestateError(
      ERROR_CODE_BINDING_SCOPE,
      `Injectable descriptor has unknown scope binding type '${String(entry.scopeBindingType)}'.`
    );
  }
}
