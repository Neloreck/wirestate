import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SEED_TOKEN } from "@/wirestate/core/registry";
import type { TAnyObject } from "@/wirestate/types/general";

/**
 * Applies shared seed to the container.
 *
 * @param container - target container
 * @param seed - shared seed object
 */
export function applySharedSeed(container: Container, seed: TAnyObject): void {
  dbg.info(prefix(__filename), "Apply shared seed:", { shared: seed, container });

  container.rebind<TAnyObject>(SEED_TOKEN).toConstantValue(seed);
}
