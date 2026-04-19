import { type Container } from 'inversify';

import { QueryBus } from '../queries/QueryBus';
import { QUERY_BUS_TOKEN } from '../registry';
import type { TQueryType } from '../types/queries';

/**
 * Dispatches a query on the provided container.
 *
 * @param container - inversify container
 * @param type - query type
 * @param data - query data
 */
export function query<R = unknown, D = unknown>(
  container: Container,
  type: TQueryType,
  data?: D,
): R | Promise<R> {
  return container.get<QueryBus>(QUERY_BUS_TOKEN).query<R, D>(type, data);
}
