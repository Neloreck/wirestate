import { Container, ServiceIdentifier } from "../alias";
import { deprovisionContainerBinding, deprovisionContainerBindings } from "../container/container-provision-lifecycle";

import { unregisterAllBindings, unregisterBinding } from "./register-binding";

/**
 * Unbinds a token through Wirestate-owned lifecycle cleanup.
 *
 * @remarks
 * This wraps Inversify's `container.unbind(token)` and also removes the
 * matching Wirestate binding registry entries. If a provider has provisioned a
 * service for the token, `@OnDeprovision` runs before Inversify deactivation.
 *
 * @group Bind
 *
 * @template T - Bound value type.
 *
 * @param container - Container losing the binding.
 * @param token - Binding token to remove.
 */
export function unbind<T = unknown>(container: Container, token: ServiceIdentifier<T>): void {
  if (container.isCurrentBound(token)) {
    deprovisionContainerBinding(container, token);
  }

  container.unbind(token);
  unregisterBinding(container, token);
}

/**
 * Unbinds every token through Wirestate-owned lifecycle cleanup.
 *
 * @remarks
 * This uses Inversify's batch `container.unbindAll()` so services can still
 * resolve each other while deactivation is running. Any provider lifecycle
 * services still owned by the container are deprovisioned before Inversify
 * deactivation. After this call, the container is disposed and should be
 * discarded.
 *
 * @group Bind
 *
 * @param container - Container losing all bindings.
 */
export function unbindAll(container: Container): void {
  deprovisionContainerBindings(container);

  container.unbindAll();

  unregisterAllBindings(container);
}
