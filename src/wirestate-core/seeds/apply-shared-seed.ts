import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SEED_TOKEN } from "../registry";
import type { AnyObject } from "../types/general";

/**
 * Applies shared seed to the container.
 *
 * @param container - target container
 * @param seed - shared seed object
 */
export function applySharedSeed(container: Container, seed: AnyObject): void {
  dbg.info(prefix(__filename), "Apply shared seed:", { shared: seed, container });

  container.rebind<AnyObject>(SEED_TOKEN).toConstantValue(seed);
}
