import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SEEDS_TOKEN } from "../registry";
import { SeedEntries, SeedsMap } from "../types/initial-state";

/**
 * Removes specific targeted seeds from the container's internal seed map.
 *
 * @remarks
 * This is typically called during provider unmounting to ensure that only
 * the seeds owned by that specific provider are removed, leaving other
 * providers' seeds intact.
 *
 * @group Seeds
 *
 * @param container - The Inversify {@link Container} to clean up.
 * @param seeds - The targeted {@link SeedEntries} to remove.
 *
 * @example
 * ```typescript
 * unapplySeeds(container, [[UserService, { initialUser: "admin" }]]);
 * ```
 */
export function unapplySeeds(container: Container, seeds: SeedEntries): void {
  const existing: SeedsMap = container.get(SEEDS_TOKEN);

  dbg.info(prefix(__filename), "Unapply seeds for container:", { existing, seeds, container });

  for (const [key] of seeds) {
    existing.delete(key);
  }
}
