import type { BindInWhenOnFluentSyntax, MapToResolvedValueInjectOptions } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, type ServiceIdentifier } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { ResolvedValueBindingDescriptor } from "../types/provision";

import { applyBindingScope } from "./apply-binding-scope";
import { registerBinding } from "./register-binding";
import { validateBindingDescriptor } from "./validate-binding-descriptor";

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

  if (descriptor.bindingType !== BindingType.ResolvedValue) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `bindResolvedValue expected binding type '${BindingType.ResolvedValue}'.`
    );
  }

  if (typeof descriptor.factory !== "function") {
    throw new WirestateError(ERROR_CODE_INVALID_ARGUMENTS, "Resolved value descriptor 'factory' must be a function.");
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
 * @param descriptor - Descriptor with `token`, `bindingType`, `factory`, and optional `injectOptions`.
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

  applyBindingScope(binding, descriptor.scopeBindingType);
  registerBinding(container, descriptor as ResolvedValueBindingDescriptor);

  return container;
}
