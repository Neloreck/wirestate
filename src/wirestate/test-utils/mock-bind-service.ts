import { Container, type Newable } from "inversify";

import { bindService } from "@/wirestate/core/bind/bind-service";

export interface IMockBindServiceOptions {
  skipLifecycle?: boolean;
}

// todo: This method does not instantiate, just binds.
export function mockBindService<T extends object>(
  container: Container,
  ServiceClass: Newable<T>,
  options: IMockBindServiceOptions = {}
): void {
  const { skipLifecycle } = options;

  return bindService(container, ServiceClass, {
    isWithIgnoreLifecycle: skipLifecycle,
  });
}
