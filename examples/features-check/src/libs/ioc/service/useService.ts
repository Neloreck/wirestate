import { type ServiceIdentifier } from 'inversify';
import { useMemo } from 'react';

import { useIocContext } from '../provision/useIocContext';

/**
 * Resolves a service instance from the container.
 * Automatically re-resolves if the container is reset or services are rebound.
 *
 * @param token - service identifier
 * @returns resolved service instance
 */
export function useService<T>(token: ServiceIdentifier<T>): T {
  const { container, revision } = useIocContext();

  // Revision bump signals a container reset; force re-resolution to drop stale instances.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => container.get<T>(token), [container, revision, token]);
}
