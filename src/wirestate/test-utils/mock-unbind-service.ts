import { Container, type Newable } from "inversify";

import type { AbstractService } from "@/wirestate/core/service/abstract-service";

/**
 * todo;
 *
 * @param container - target container to unbind service from
 * @param ServiceClass - service class to unbind
 */
export function mockBindService<T extends AbstractService>(container: Container, ServiceClass: Newable<T>): void {
  container.unbind(ServiceClass);
}
