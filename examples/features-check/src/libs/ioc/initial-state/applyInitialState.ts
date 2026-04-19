import type { Container } from 'inversify';

import { INITIAL_STATE_SHARED_TOKEN, INITIAL_STATE_TOKEN } from '../registry';
import type { TAnyObject } from '../types/general';
import type { TInitialStateEntries } from '../types/initial-state';
import { InitialState } from './InitialState';

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
  bound: TInitialStateEntries = [],
): void {
  // We create a fresh map on every application to ensure container isolation and snapshot stability.
  const next: InitialState = new InitialState(shared, bound);

  if (container.isBound(INITIAL_STATE_TOKEN)) {
    container.rebind<InitialState>(INITIAL_STATE_TOKEN).toConstantValue(next);
    container
      .rebind<TAnyObject>(INITIAL_STATE_SHARED_TOKEN)
      .toConstantValue(next.getShared());
  } else {
    container.bind<InitialState>(INITIAL_STATE_TOKEN).toConstantValue(next);
    container
      .bind<TAnyObject>(INITIAL_STATE_SHARED_TOKEN)
      .toConstantValue(next.getShared());
  }
}
