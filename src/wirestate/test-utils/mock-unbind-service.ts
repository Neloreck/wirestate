import { Container, type Newable } from "inversify";

import { AbstractService } from "@/wirestate";

/**
 * todo;
 *
 * @param container - target container to unbind service from
 * @param ServiceClass - service class to unbind
 */
export function mockBindService<T extends AbstractService>(container: Container, ServiceClass: Newable<T>): void {
  container.unbind(ServiceClass);
}
