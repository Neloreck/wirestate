import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, type Identifier } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { ResolvedValueBindingDescriptor, ResolvedValueInjectOption } from "../types/provision";

import { toProviderScope } from "./utils/apply-binding-scope";
import { registerBinding } from "./utils/register-binding";
import { validateBindingDescriptor } from "./utils/validate-binding-descriptor";

/**
 * Resolves a single factory argument from its injection option.
 *
 * @group Bind
 * @internal
 *
 * @param container - Container resolving the binding.
 * @param option - Injection option: a token or a token with options.
 * @returns The resolved argument value.
 */
function resolveInjectOption(container: Container, option: ResolvedValueInjectOption): unknown {
  if (typeof option === "object" && option !== null && "token" in option) {
    return container.get(option.token, { optional: option.optional === true });
  }

  return container.get(option as Identifier);
}

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

  const injectOptions: ReadonlyArray<ResolvedValueInjectOption> = (descriptor.injectOptions ??
    []) as ReadonlyArray<ResolvedValueInjectOption>;

  container.bind<T>({
    provide: descriptor.token as Identifier<T>,
    scope: toProviderScope(descriptor.scope),
    useFactory: (current) => {
      const args: Array<unknown> = injectOptions.map((option) => resolveInjectOption(current, option));

      return (descriptor.factory as (...resolved: Array<unknown>) => T)(...args);
    },
  });

  registerBinding(container, descriptor as ResolvedValueBindingDescriptor);

  return container;
}
