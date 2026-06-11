import { BindingScope, BindingType, type BindingDescriptor } from "../binding/binding";
import { isFactoryDescriptor } from "../binding/binding-guards";
import { type Identifier, toString } from "../binding/tokens";
import {
  ERROR_CODE_INVALID_ARGUMENTS,
  ERROR_CODE_INVALID_BINDING_SCOPE,
  ERROR_CODE_VALIDATION_ERROR,
} from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { isInjectable } from "../metadata/injectable";
import type { Newable } from "../utils/class-like";

/**
 * Validates a binding descriptor before registration.
 *
 * @remarks
 * Bare classes are normalized to instance descriptors before validation, so
 * every binding reaching this point must be a descriptor object. Validation
 * covers token presence, known `type`/`scope` names, per-kind field checks,
 * `@Injectable()` enforcement for instance bindings, and rebind safety.
 *
 * @internal
 *
 * @param token - Token the descriptor is registered under.
 * @param binding - Binding descriptor to validate.
 * @param hasConstructedValues - Whether the token's existing binding already constructed values.
 *
 * @throws {@link WirestateError} If the binding is not a descriptor object with a token,
 * uses an unknown `type` or `scope`, misses fields required by its binding kind,
 * an instance binding's class is not marked with `@Injectable()`, or the token's
 * existing binding already constructed values.
 */
export function validateBinding<T>(
  token: Identifier<T>,
  binding: BindingDescriptor<T>,
  hasConstructedValues: boolean
): void {
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

  const type = binding.type ?? (isFactoryDescriptor(binding) ? BindingType.Factory : BindingType.Value);

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

  if (hasConstructedValues) {
    throw new WirestateError(
      `Cannot bind a new binding for ${toString(token)}, since the existing binding was already constructed.`,
      ERROR_CODE_VALIDATION_ERROR
    );
  }
}
