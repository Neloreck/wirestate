import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { INITIAL_STATE_TOKEN, INITIAL_STATES_TOKEN } from "@/wirestate/core/registry";
import type { TAnyObject } from "@/wirestate/types/general";
import { TInitialStateEntries, TInitialStatesMap } from "@/wirestate/types/initial-state";

/**
 * Applies initial state to the container.
 * into the existing instance instead of replacing it. This allows multiple providers
 * to co-exist without wiping each other's seeds.
 *
 * @param container - target container
 * @param shared - shared state object
 * @param bound - targeted state entries
 */
export function applyInitialStates(
  container: Container,
  shared: TAnyObject = {},
  bound: TInitialStateEntries = []
): void {
  const existing: TInitialStatesMap = container.get(INITIAL_STATES_TOKEN);

  dbg.info(prefix(__filename), "Merging initial state for container:", { shared, bound, existing, container });

  for (const [key, state] of bound) {
    existing.set(key, state);
  }

  container.rebind<TAnyObject>(INITIAL_STATE_TOKEN).toConstantValue(shared);
}

/**
 * Removes specific targeted initial state entries from the container.
 * Used during provider unmounting to clean up only the entries owned by that provider.
 *
 * @param container - target container
 * @param bound - targeted state entries to remove
 */
export function removeInitialStateEntries(container: Container, bound: TInitialStateEntries = []): void {
  const existing: TInitialStatesMap = container.get(INITIAL_STATES_TOKEN);

  dbg.info("Removing initial state entries for container:", { existing, bound, container });

  for (const [key] of bound) {
    existing.delete(key);
  }
}
