import type { ContainerKernel } from "../container/container-kernel";

import { getMessagingRegistrations } from "./messaging-registration";

/**
 * Registers an instance's decorated messaging handlers against the buses bound on its container.
 *
 * @remarks
 * The messaging side of instance Activation, called by the Wirestate activation
 * adapter. It is bus-agnostic: each kind's wiring is supplied by its decorator as
 * a {@link MessagingRegistration}, so this module imports no bus and an unused
 * bus is never pulled into the bundle by the activation path. A bus that is not
 * bound is skipped — `{ optional: true }` resolves up the parent chain. Each
 * registration's teardown callbacks are collected into `disposers`.
 *
 * @param container - Container that owns the instance.
 * @param instance - Activated instance.
 * @param disposers - Collector for handler teardown callbacks.
 * @internal
 */
export function registerMessagingHandlers(
  container: ContainerKernel,
  instance: object,
  disposers: Array<() => void>
): void {
  for (const registration of getMessagingRegistrations(instance)) {
    const bus: unknown = container.get(registration.token, { optional: true });

    if (bus) {
      disposers.push(...registration.register(bus as object, instance, container));
    }
  }
}
