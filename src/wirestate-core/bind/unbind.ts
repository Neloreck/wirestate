import { Container, ServiceIdentifier } from "../alias";
import { deprovisionContainerBinding, deprovisionContainerBindings } from "../service/provision-lifecycle";

import { unregisterAllBindings, unregisterBinding } from "./register-binding";

/**
 * Unbinds a token through Wirestate-owned lifecycle cleanup.
 *
 * @remarks
 * This wraps Inversify's `container.unbind(identifier)` and also removes the
 * matching Wirestate binding registry entries. If a provider has provisioned a
 * service for the token, `@OnDeprovision` runs before Inversify deactivation.
 *
 * @group Bind
 *
 * @template T - Bound value type.
 *
 * @param container - Container losing the binding.
 * @param identifier - Binding token to remove.
 */
export function unbind<T = unknown>(container: Container, identifier: ServiceIdentifier<T>): void {
  if (container.isCurrentBound(identifier)) {
    deprovisionContainerBinding(container, identifier);
  }

  container.unbind(identifier);
  unregisterBinding(container, identifier);
}

/**
 * Unbinds every token through Wirestate-owned lifecycle cleanup.
 *
 * @remarks
 * This wraps Inversify's `container.unbindAll()` and also clears the Wirestate
 * binding registry. Any provider lifecycle services still owned by the container
 * are deprovisioned before Inversify deactivation.
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
