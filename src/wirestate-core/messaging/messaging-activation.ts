import type { ContainerKernel } from "../container/container-kernel";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";

import { getMessagingRegistrations } from "./messaging-registration";

/**
 * Registers an instance's decorated messaging handlers against the buses its own container binds.
 *
 * @remarks
 * The messaging side of instance Activation, called by the Wirestate activation
 * adapter. It is bus-agnostic: each kind's wiring is supplied by its decorator as
 * a `MessagingRegistration`, so this module imports no bus and an unused bus is
 * never pulled into the bundle by the activation path.
 *
 * A handler registers only on a bus its **own** container binds (`hasOwn`, not
 * the inherited parent chain), so the subscription shares the container's
 * lifetime and a dropped container can never strand a stale handler on a
 * surviving inherited bus. Declaring a handler whose bus is not bound on the
 * owning container throws synchronously at activation — a composition mistake
 * fails fast rather than silently dropping the handler.
 *
 * @internal
 *
 * @param container - Container that owns the instance.
 * @param instance - Activated instance.
 * @param disposers - Collector for handler teardown callbacks.
 *
 * @throws {@link WirestateError} If a declared handler's bus is not bound on the owning container.
 */
export function registerMessagingHandlers(
  container: ContainerKernel,
  instance: object,
  disposers: Array<() => void>
): void {
  for (const registration of getMessagingRegistrations(instance)) {
    if (container.hasOwn(registration.token)) {
      disposers.push(...registration.register(container.get(registration.token) as object, instance, container));
    } else {
      const busName: string =
        typeof registration.token === "function" ? registration.token.name : String(registration.token);

      throw new WirestateError(
        `Service '${instance.constructor.name}' declares a messaging handler but its container has no '${busName}' ` +
          `bound. Bind the bus on the container that owns the service.`,
        ERROR_CODE_VALIDATION_ERROR
      );
    }
  }
}
