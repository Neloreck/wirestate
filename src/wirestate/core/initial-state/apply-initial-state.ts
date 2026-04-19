import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";

import { InitialState } from "@/wirestate/core/initial-state/initial-state";
import { INITIAL_STATE_SHARED_TOKEN, INITIAL_STATE_TOKEN } from "@/wirestate/core/registry";
import type { TAnyObject } from "@/wirestate/types/general";
import type { TInitialStateEntries } from "@/wirestate/types/initial-state";

/**
 * Binds or rebinds an {@link InitialState} to the container.
 *
 * @param container - target container
 * @param shared - shared state object
 * @param bound - targeted state entries
 */
export function applyInitialState(
  container: Container,
  shared: TAnyObject = {},
  bound: TInitialStateEntries = []
): void {
  // We create a fresh map on every application to ensure container isolation and snapshot stability.
  const nextInitialState: InitialState = new InitialState(shared, bound);

  if (container.isBound(INITIAL_STATE_TOKEN)) {
    dbg.info("Rebinding initial state for container:", { nextInitialState, container });

    container.rebind<InitialState>(INITIAL_STATE_TOKEN).toConstantValue(nextInitialState);
    container.rebind<TAnyObject>(INITIAL_STATE_SHARED_TOKEN).toConstantValue(nextInitialState.getShared());
  } else {
    dbg.info("Binding initial state for container:", { nextInitialState, container });

    container.bind<InitialState>(INITIAL_STATE_TOKEN).toConstantValue(nextInitialState);
    container.bind<TAnyObject>(INITIAL_STATE_SHARED_TOKEN).toConstantValue(nextInitialState.getShared());
  }
}
