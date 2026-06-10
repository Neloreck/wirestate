import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, type Identifier } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { ServiceRedirectionBindingDescriptor } from "../types/provision";

import { registerBinding } from "./utils/register-binding";
import { validateBindingDescriptor } from "./utils/validate-binding-descriptor";

/**
 * Validates that a descriptor can be bound by {@link bindServiceRedirection}.
 *
 * @group Bind
 * @internal
 *
 * @param descriptor - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor is invalid.
 */
function validateServiceRedirectionDescriptor(descriptor: ServiceRedirectionBindingDescriptor): void {
  validateBindingDescriptor(descriptor);

  if (descriptor.type !== BindingType.ServiceRedirection) {
    throw new WirestateError(
      `bindServiceRedirection expected type '${BindingType.ServiceRedirection}'.`,
      ERROR_CODE_INVALID_ARGUMENTS
    );
  }

  if (
    !Object.prototype.hasOwnProperty.call(descriptor, "service") ||
    descriptor.service === undefined ||
    descriptor.service === null
  ) {
    throw new WirestateError(
      "Service redirection descriptor must provide a 'service' token.",
      ERROR_CODE_INVALID_ARGUMENTS
    );
  }
}

/**
 * Binds one token as a redirection to another service token.
 *
 * @group Bind
 *
 * @template T - Resolved service type.
 *
 * @param container - Container to bind into.
 * @param descriptor - Descriptor with `token`, `type`, and `service`.
 * @returns The same container for chaining or immediate resolution.
 *
 * @throws {@link WirestateError} If the descriptor is invalid.
 */
export function bindServiceRedirection<T>(
  container: Container,
  descriptor: ServiceRedirectionBindingDescriptor<T>
): Container {
  validateServiceRedirectionDescriptor(descriptor);

  dbg.info(prefix(__filename), "Binding service redirection descriptor:", {
    descriptor,
    container,
  });

  container.bind<T>({
    token: descriptor.token as Identifier<T>,
    service: descriptor.service as Identifier<T>,
  });

  registerBinding(container, descriptor);

  return container;
}
