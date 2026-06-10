import type { BindingDescriptor } from "../binding/binding";
import { isInstanceDescriptor } from "../binding/binding-guards";
import { isInjectable } from "../injectable";
import { type Identifier, toString } from "../tokens";
import type { Class } from "../utils/class-like";

/**
 * Validates a binding descriptor before registration.
 *
 * @param token - Token the descriptor is registered under.
 * @param binding - Binding descriptor to validate.
 * @param hasConstructedValues - Whether the token's existing binding already constructed values.
 *
 * @throws {@link Error} If the binding is not a descriptor object with a token,
 * an instance binding's class is not marked with `@Injectable()`, or the token's
 * existing binding already constructed values.
 * @internal
 */
export function validateBinding<T>(
  token: Identifier<T>,
  binding: BindingDescriptor<T>,
  hasConstructedValues: boolean
): void {
  if (binding === null || typeof binding !== "object" || token === null || token === undefined) {
    throw Error(
      `Cannot bind: expected a binding descriptor object with a "token" field. ` +
        `Bare class bindings are not supported; use "{ token: MyClass, type: 'Instance', value: MyClass }" instead.`
    );
  }

  if (isInstanceDescriptor(binding) && !isInjectable(binding.value as Class<object>)) {
    throw Error(`Class '${binding.value.name}' must be decorated with @Injectable() to be bound.`);
  }

  if (hasConstructedValues) {
    throw Error(
      `Cannot bind a new binding for ${toString(token)}, since the existing binding was already constructed.`
    );
  }
}
