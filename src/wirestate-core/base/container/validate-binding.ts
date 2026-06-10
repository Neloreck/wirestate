import type { BindingDescriptor } from "../binding/binding";
import { isMultiBinding, isServiceRedirectionDescriptor } from "../binding/binding-guards";
import { type Identifier, toString } from "../tokens";

/**
 * Validates a binding descriptor against the bindings already registered for its token.
 *
 * @param token - Token the descriptor is registered under.
 * @param binding - Binding descriptor to validate.
 * @param existing - Binding descriptors already registered for the token.
 * @param hasConstructedValues - Whether any existing binding already constructed values.
 *
 * @throws {@link Error} If the binding is not a descriptor object with a token,
 * a service redirection refers to itself, the token's existing binding already
 * constructed values, or multi/non-multi bindings are mixed.
 * @internal
 */
export function validateBinding<T>(
  token: Identifier<T>,
  binding: BindingDescriptor<T>,
  existing: ReadonlyArray<BindingDescriptor<T>>,
  hasConstructedValues: boolean
): void {
  if (binding === null || typeof binding !== "object" || token === null || token === undefined) {
    throw Error(
      `Cannot bind: expected a binding descriptor object with a "token" field. ` +
        `Bare class bindings are not supported; use "{ token: MyClass, type: 'Instance', value: MyClass }" instead.`
    );
  }

  if (isServiceRedirectionDescriptor(binding) && binding.token === binding.service) {
    throw Error(`The service redirection for token ${toString(token)} cannot refer to itself.`);
  }

  if (!isServiceRedirectionDescriptor(binding) && hasConstructedValues) {
    throw Error(
      `Cannot bind a new binding for ${toString(token)}, since the existing binding was already constructed.`
    );
  }

  const multi = isMultiBinding(binding);

  if (multi && existing.some((it) => !isMultiBinding(it))) {
    throw Error(
      `Cannot bind ${toString(token)} as multi-binding, since there is already a binding which is not a multi-binding.`
    );
  } else if (!multi && existing.some((it) => isMultiBinding(it))) {
    throw Error(
      `Cannot bind ${toString(token)} as binding, since there are already binding(s) that are multi-bindings.`
    );
  }
}
