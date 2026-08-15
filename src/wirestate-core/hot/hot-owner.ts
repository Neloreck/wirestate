import { type Container, type ContainerConfig } from "../container/container";

import { getHotState } from "./hot-registry";

/**
 * A framework provider that owns a managed container and can rebuild it during a hot swap.
 *
 * @remarks
 * Registered by framework integrations (for example the React `ContainerProvider`)
 * for every managed container while it is committed. The swap orchestrator reads
 * the current container, tears it down, constructs a replacement through
 * {@link HotSwapOwner.create}, and hands it back through {@link HotSwapOwner.commit}.
 *
 * @group Hot
 */
export interface HotSwapOwner {
  /**
   * Container currently committed by the owner.
   *
   * @remarks
   * Mutated by the orchestrator after a swap so parent-chain lookups in a later
   * swap see the live container.
   */
  container: Container;

  /**
   * Config the current container was constructed from.
   *
   * @remarks
   * Class references inside may be stale after module replacement. The orchestrator remaps
   * them to their newest generations before calling {@link HotSwapOwner.create}, then writes
   * the remapped config back here so the owner describes the container it now holds.
   *
   * Register one long-lived owner object rather than a fresh one per render: an owner
   * recreated from the original config would read as outdated on every later swap and rebuild
   * its container needlessly.
   */
  config: ContainerConfig;

  /**
   * Constructs a replacement container from a remapped config.
   *
   * @param config - Remapped config with up-to-date classes and parent.
   * @returns Replacement container.
   */
  create(config: ContainerConfig): Container;

  /**
   * Commits the replacement container to the owner's view layer.
   *
   * @param container - Replacement container to publish.
   */
  commit(container: Container): void;
}

/**
 * Registers a provider as the hot-swap owner of its managed container.
 *
 * @group Hot
 *
 * @param owner - Owner registration for one managed container.
 * @returns Callback that removes the registration.
 */
export function registerHotSwapOwner(owner: HotSwapOwner): () => void {
  const owners: Set<HotSwapOwner> = getHotState().owners;

  owners.add(owner);

  return () => {
    owners.delete(owner);
  };
}
