import { Container } from "../../alias";
import { WireStatus } from "../../container/wire-status";
import { PROVISION_STATUS_BY_CONTAINER } from "../../registry";

/**
 * Starts lifecycle tracking for an activated instance.
 *
 * @internal
 *
 * @param container - Owning container.
 * @param instance - Activated instance.
 */
export function initializeInstanceStatus(container: Container, instance: object): void {
  const status: WireStatus = WireStatus.for(instance, { initialize: true });

  status.isDisposed = false;

  const isProvisioned = PROVISION_STATUS_BY_CONTAINER.get(container);

  status.isDeprovisioned = isProvisioned === undefined ? null : !isProvisioned;
  status.provisionId = null;
}

/**
 * Marks an instance as deactivated.
 *
 * @internal
 *
 * @param instance - Deactivated instance.
 */
export function unregisterInstanceStatus(instance: object): void {
  const status: WireStatus = WireStatus.for(instance);

  status.isDisposed = true;
  status.isDeprovisioned = true;
}
