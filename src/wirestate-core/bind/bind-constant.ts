import { BindWhenOnFluentSyntax, Container, type ServiceIdentifier } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ScopeBindingType } from "../alias";
import { ERROR_CODE_BINDING_SCOPE } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { InjectableDescriptor } from "../types/privision";

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
  dbg.info(prefix(__filename), "Binding constant:", {
    id: entry.id,
    value: entry.value,
    entry,
    container,
  });

  if (entry.scopeBindingType && entry.scopeBindingType !== ScopeBindingType.Singleton) {
    throw new WirestateError(ERROR_CODE_BINDING_SCOPE, "Provided unexpected binding scope for constant value.");
  }

  return container.bind<T>(entry.id as ServiceIdentifier<T>).toConstantValue(entry.value as T);
}
