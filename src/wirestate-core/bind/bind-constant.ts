import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindWhenOnFluentSyntax, Container, type ServiceIdentifier } from "../alias";
import { BindingType, ScopeBindingType } from "../alias";
import { ERROR_CODE_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { InjectableDescriptor } from "../types/provision";

import { registerContainerEntry } from "./bind-register";
import { validateInjectableDescriptor } from "./validate-injectable-descriptor";

/**
 * Validates that a descriptor can be bound by {@link bindConstant}.
 *
 * @group Bind
 * @internal
 *
 * @param entry - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor is missing a token, uses a non-constant binding type,
 * or omits the `value` field.
 */
function validateConstantDescriptor(entry: InjectableDescriptor): void {
  validateInjectableDescriptor(entry);

  if (entry.bindingType !== undefined && entry.bindingType !== BindingType.ConstantValue) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `bindConstant expected binding type '${BindingType.ConstantValue}'.`
    );
  }

  if (!Object.prototype.hasOwnProperty.call(entry, "value")) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      "Constant value descriptor must provide a 'value' property."
    );
  }
}

/**
 * Binds a constant value to a service identifier in the container.
 *
 * @remarks
 * Use this to register configuration values, primitive constants, or pre-instantiated objects.
 * Constant values are bound with a singleton scope by default.
 *
 * @group Bind
 *
 * @template T - Type of the service being bound.
 *
 * @param container - Target Inversify {@link Container}.
 * @param entry - Descriptor containing `id` (token) and `value` (constant).
 * @returns Inversify fluent syntax for additional constraints.
 *
 * @throws {@link WirestateError} If `entry.scopeBindingType` is not `Singleton`.
 *
 * @example
 * ```typescript
 * const API_URL: unique symbol = Symbol("API_URL");
 *
 * bindConstant(container, {
 *   id: API_URL,
 *   value: "https://api.example.com"
 * });
 * ```
 */
export function bindConstant<T>(container: Container, entry: InjectableDescriptor): BindWhenOnFluentSyntax<T> {
  validateConstantDescriptor(entry);

  dbg.info(prefix(__filename), "Binding constant:", {
    id: entry.id,
    value: entry.value,
    entry,
    container,
  });

  if (entry.scopeBindingType && entry.scopeBindingType !== ScopeBindingType.Singleton) {
    throw new WirestateError(ERROR_CODE_BINDING_SCOPE, "Provided unexpected binding scope for constant value.");
  }

  const binding: BindWhenOnFluentSyntax<T> = container
    .bind<T>(entry.id as ServiceIdentifier<T>)
    .toConstantValue(entry.value as T);

  registerContainerEntry(container, entry);

  return binding;
}
