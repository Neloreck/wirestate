import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, type ServiceIdentifier } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { BindingDescriptor } from "../types/provision";

import { registerBinding } from "./register-binding";
import { validateBindingDescriptor } from "./validate-binding-descriptor";

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
function validateServiceRedirectionDescriptor(descriptor: BindingDescriptor): void {
  validateBindingDescriptor(descriptor);

  if (descriptor.bindingType !== BindingType.ServiceRedirection) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `bindServiceRedirection expected binding type '${BindingType.ServiceRedirection}'.`
    );
  }

  if (
    !Object.prototype.hasOwnProperty.call(descriptor, "service") ||
    descriptor.service === undefined ||
    descriptor.service === null
  ) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      "Service redirection descriptor must provide a 'service' token."
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
 * @param descriptor - Descriptor with `id`, `bindingType`, and `service`.
 * @returns The same container for chaining or immediate resolution.
 *
 * @throws {@link WirestateError} If the descriptor is invalid.
 */
export function bindServiceRedirection<T>(container: Container, descriptor: BindingDescriptor<T>): Container {
  validateServiceRedirectionDescriptor(descriptor);

  dbg.info(prefix(__filename), "Binding service redirection descriptor:", {
    descriptor,
    container,
  });

  container.bind<T>(descriptor.id as ServiceIdentifier<T>).toService(descriptor.service as ServiceIdentifier<T>);

  registerBinding(container, descriptor);

  return container;
}
