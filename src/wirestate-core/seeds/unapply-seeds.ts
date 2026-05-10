import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SEEDS_TOKEN } from "../registry";
import { SeedEntries, SeedsMap } from "../types/initial-state";

/**
 * Removes specific seeds from the container.
 * Used during provider unmounting to clean up only the entries owned by that provider.
 *
 * @group seeds
 *
 * @param container - target container
 * @param seeds - targeted seeds to remove
 */
export function unapplySeeds(container: Container, seeds: SeedEntries): void {
  const existing: SeedsMap = container.get(SEEDS_TOKEN);

  dbg.info(prefix(__filename), "Unapply seeds for container:", { existing, seeds, container });

  for (const [key] of seeds) {
    existing.delete(key);
  }
}
