import { Container, type Newable } from "inversify";

import { bindService } from "@/wirestate/core/container/bind/bind-service";
import { AbstractService } from "@/wirestate/core/service/abstract-service";

export interface IMockBindServiceOptions {
  skipLifecycle?: boolean;
}

// todo: This method does not instantiate, just binds.
export function mockBindService<T extends AbstractService>(
  container: Container,
  ServiceClass: Newable<T>,
  options: IMockBindServiceOptions = {}
): void {
  const { skipLifecycle } = options;

  return bindService(container, ServiceClass, {
    isWithIgnoreLifecycle: skipLifecycle,
  });
}
