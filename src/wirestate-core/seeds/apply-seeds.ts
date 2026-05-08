import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SEEDS_TOKEN } from "../registry";
import { SeedEntries, SeedsMap } from "../types/initial-state";

/**
 * Applies seeds to the container into the existing instance instead of replacing it.
 * This allows multiple providers to co-exist without wiping each other's seeds.
 *
 * @param container - target container
 * @param seeds - targeted seed entries apply
 */
export function applySeeds(container: Container, seeds: SeedEntries): void {
  const existing: SeedsMap = container.get(SEEDS_TOKEN);

  dbg.info(prefix(__filename), "Applying seeds for container:", { seeds, existing, container });

  for (const [key, state] of seeds) {
    existing.set(key, state);
  }
}
