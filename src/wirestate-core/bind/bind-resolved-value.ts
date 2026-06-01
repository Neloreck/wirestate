import type { BindInWhenOnFluentSyntax, MapToResolvedValueInjectOptions } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, type ServiceIdentifier } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { ResolvedValueBindingDescriptor } from "../types/provision";

import { applyBindingScope } from "./utils/apply-binding-scope";
import { registerBinding } from "./utils/register-binding";
import { validateBindingDescriptor } from "./utils/validate-binding-descriptor";

/**
 * Validates that a descriptor can be bound by {@link bindResolvedValue}.
 *
 * @group Bind
 * @internal
 *
 * @param descriptor - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor is invalid.
 */
function validateResolvedValueDescriptor<T, TArgs extends Array<unknown>>(
  descriptor: ResolvedValueBindingDescriptor<T, TArgs>
): void {
  validateBindingDescriptor(descriptor);

  if (descriptor.type !== BindingType.ResolvedValue) {
    throw new WirestateError(
      `bindResolvedValue expected type '${BindingType.ResolvedValue}'.`,
      ERROR_CODE_INVALID_ARGUMENTS
    );
  }

  if (typeof descriptor.factory !== "function") {
    throw new WirestateError("Resolved value descriptor 'factory' must be a function.", ERROR_CODE_INVALID_ARGUMENTS);
  }
}

/**
 * Binds a resolved value factory to a token.
 *
 * @group Bind
 *
 * @template T - Resolved value type.
 *
 * @param container - Container to bind into.
 * @param descriptor - Descriptor with `token`, `type`, `factory`, and optional `injectOptions`.
 * @returns The same container for chaining or immediate resolution.
 *
 * @throws {@link WirestateError} If the descriptor is invalid.
 */
export function bindResolvedValue<T, FA extends Array<unknown> = Array<unknown>>(
  container: Container,
  descriptor: ResolvedValueBindingDescriptor<T, FA>
): Container {
  validateResolvedValueDescriptor(descriptor);

  dbg.info(prefix(__filename), "Binding resolved value descriptor:", {
    descriptor,
    container,
  });

  const binding: BindInWhenOnFluentSyntax<T> = descriptor.injectOptions
    ? container
        .bind<T>(descriptor.token as ServiceIdentifier<T>)
        .toResolvedValue(
          descriptor.factory as (...args: Array<unknown>) => T | Promise<T>,
          descriptor.injectOptions as MapToResolvedValueInjectOptions<Array<unknown>>
        )
    : container
        .bind<T>(descriptor.token as ServiceIdentifier<T>)
        .toResolvedValue(descriptor.factory as () => T | Promise<T>);

  applyBindingScope(binding, descriptor.scope);
  registerBinding(container, descriptor as ResolvedValueBindingDescriptor);

  return container;
}
