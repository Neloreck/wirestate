import { Container } from 'inversify';

import { useIocContext } from './useIocContext';

/**
 * Returns the active IoC container.
 *
 * @returns active Inversify container
 */
export function useContainer(): Container {
  return useIocContext().container;
}
