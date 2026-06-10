import { Container, Identifier } from "../alias";
import { deprovisionContainerBinding, deprovisionContainerBindings } from "../container/container-provision-lifecycle";

import { unregisterAllBindings, unregisterBinding } from "./utils/register-binding";

/**
 * Unbinds a token through Wirestate-owned lifecycle cleanup.
 *
 * @remarks
 * This wraps the container's `unbind(token)` and also removes the
 * matching Wirestate binding registry entries. If a provider has provisioned an
 * instance for the token, `@OnDeprovision` runs before binding deactivation.
 *
 * @group Bind
 *
 * @template T - Bound value type.
 *
 * @param container - Container losing the binding.
 * @param token - Binding token to remove.
 */
export function unbind<T = unknown>(container: Container, token: Identifier<T>): void {
  if (container.hasOwn(token)) {
    deprovisionContainerBinding(container, token);
  }

  container.unbind(token);
  unregisterBinding(container, token);
}

/**
 * Unbinds every token through Wirestate-owned lifecycle cleanup.
 *
 * @remarks
 * This uses the container's batch `unbindAll()` so services can still
 * resolve each other while deactivation is running. Any provider lifecycle
 * services still owned by the container are deprovisioned before binding
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
