import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SEEDS_TOKEN } from "@/wirestate/core/registry";
import { TSeedEntries, TSeedsMap } from "@/wirestate/types/initial-state";

/**
 * Applies seeds to the container into the existing instance instead of replacing it.
 * This allows multiple providers to co-exist without wiping each other's seeds.
 *
 * @param container - target container
 * @param seeds - targeted seed entries apply
 */
export function applySeeds(container: Container, seeds: TSeedEntries): void {
  const existing: TSeedsMap = container.get(SEEDS_TOKEN);

  dbg.info(prefix(__filename), "Applying seeds for container:", { seeds, existing, container });

  if (seeds) {
    for (const [key, state] of seeds) {
      existing.set(key, state);
    }
  }
}
