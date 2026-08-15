import {
  ERROR_CODE_INVALID_ARGUMENTS,
  ERROR_CODE_INVALID_BINDING_SCOPE,
  ERROR_CODE_VALIDATION_ERROR,
} from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { isInjectable } from "../metadata/metadata-injectable";
import { type Newable } from "../types/general";

import { type ServiceToken, BindingScope, BindingType, type BindingDescriptor } from "./binding";
import { getBindingType } from "./binding-lifecycle";
import { tokenToString } from "./binding-tokens";

/**
 * Validates a binding descriptor before registration.
 *
 * @remarks
 * Runs the structural checks of {@link validateBindingStructure} and then rejects
 * a rebind of a token whose existing binding already constructed values.
 *
 * @internal
 *
 * @param token - Token the descriptor is registered under.
 * @param binding - Binding descriptor to validate.
 * @param hasConstructedValues - Whether the token's existing binding already constructed values.
 *
 * @throws {@link WirestateError} If the descriptor is structurally invalid, or the
 * token's existing binding already constructed values.
 */
export function validateBinding<T>(
  token: ServiceToken<T>,
  binding: BindingDescriptor<T>,
  hasConstructedValues: boolean
): void {
  validateBindingStructure(token, binding);

  if (hasConstructedValues) {
    throw new WirestateError(
      `Cannot bind a new binding for '${tokenToString(token)}', since the existing binding was already constructed.`,
      ERROR_CODE_VALIDATION_ERROR
    );
  }
}

/**
 * Validates the shape of a binding descriptor.
 *
 * @remarks
 * Bare classes are normalized to instance descriptors before validation, so
 * every binding reaching this point must be a descriptor object. Covers token
 * presence, known `type`/`scope` names, per-kind field checks, and `@Injectable()`
 * enforcement for instance bindings.
 *
 * Kept separate from {@link validateBinding} so `Container` can settle the shape
 * of a descriptor before its own kind-specific guards run, keeping a structural
 * error from being reported as a lifecycle one.
 *
 * @internal
 *
 * @param token - Token the descriptor is registered under.
 * @param binding - Binding descriptor to validate.
 *
 * @throws {@link WirestateError} If the binding is not a descriptor object with a token,
 * uses an unknown `type` or `scope`, misses fields required by its binding kind, or is an
 * instance binding whose class is not marked with `@Injectable()`.
 */
export function validateBindingStructure<T>(token: ServiceToken<T>, binding: BindingDescriptor<T>): void {
  if (binding === null || typeof binding !== "object") {
    throw new WirestateError(
      "Cannot bind: expected a service class or a binding descriptor object.",
      ERROR_CODE_INVALID_ARGUMENTS
    );
  }

  if (!Object.prototype.hasOwnProperty.call(binding, "token") || token === undefined || token === null) {
    throw new WirestateError("Binding descriptor must provide a 'token' property.", ERROR_CODE_INVALID_ARGUMENTS);
  }

  if (binding.type !== undefined && !Object.values(BindingType).includes(binding.type)) {
    throw new WirestateError(
      `Binding descriptor has unknown type '${String(binding.type)}'.`,
      ERROR_CODE_INVALID_ARGUMENTS
    );
  }

  const scope: unknown = (binding as { scope?: unknown }).scope;

  if (scope !== undefined && !Object.values(BindingScope).includes(scope as never)) {
    throw new WirestateError(
      `Binding descriptor has unknown scope '${String(scope)}'.`,
      ERROR_CODE_INVALID_BINDING_SCOPE
    );
  }

  if ("factory" in binding && "value" in binding) {
    throw new WirestateError(
      "Binding descriptor must provide either 'value' or 'factory', not both.",
      ERROR_CODE_INVALID_ARGUMENTS
    );
  }

  const type = getBindingType(binding);

  if (type === BindingType.Instance) {
    const value: unknown = (binding as { value?: unknown }).value;

    if (typeof value !== "function") {
      throw new WirestateError("Instance descriptor 'value' must be a constructor.", ERROR_CODE_INVALID_ARGUMENTS);
    }

    if (!isInjectable(value as Newable<object>)) {
      throw new WirestateError(
        `Class '${(value as Newable<object>).name}' must be decorated with @Injectable() to be bound.`,
        ERROR_CODE_VALIDATION_ERROR
      );
    }
  } else if (type === BindingType.Factory) {
    if (typeof (binding as { factory?: unknown }).factory !== "function") {
      throw new WirestateError("Factory descriptor 'factory' must be a function.", ERROR_CODE_INVALID_ARGUMENTS);
    }
  } else {
    if (scope !== undefined && scope !== BindingScope.Singleton) {
      throw new WirestateError("Provided unexpected binding scope for value.", ERROR_CODE_INVALID_BINDING_SCOPE);
    }

    if (!Object.prototype.hasOwnProperty.call(binding, "value")) {
      throw new WirestateError("Value descriptor must provide a 'value' property.", ERROR_CODE_INVALID_ARGUMENTS);
    }
  }
}
