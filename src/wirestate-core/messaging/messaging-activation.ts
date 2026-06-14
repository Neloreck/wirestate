import type { ContainerKernel } from "../container/container-kernel";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import type { Maybe } from "../types/general";

import { getMessagingRegistrations } from "./messaging-registration";

/**
 * Subscribes an instance's decorated messaging handlers onto the buses it resolves.
 *
 * @internal
 *
 * @param container - Container that owns the instance (where bus resolution starts).
 * @param instance - Provisioned instance.
 * @param disposers - Collector for handler teardown callbacks.
 *
 * @throws {@link WirestateError} If a declared handler's bus is bound nowhere in the chain.
 */
export function registerMessagingHandlers(
  container: ContainerKernel,
  instance: object,
  disposers: Array<() => void>
): void {
  for (const registration of getMessagingRegistrations(instance)) {
    const bus: Maybe<object> = container.get(registration.token, { optional: true }) as Maybe<object>;

    if (bus) {
      disposers.push(...registration.register(bus, instance, container));
    } else {
      const busName: string =
        typeof registration.token === "function" ? registration.token.name : String(registration.token);

      throw new WirestateError(
        `Service '${instance.constructor.name}' declares a messaging handler but no '${busName}' is bound on its ` +
          `container or any ancestor. Bind the bus on the owning container or a parent.`,
        ERROR_CODE_VALIDATION_ERROR
      );
    }
  }
}
