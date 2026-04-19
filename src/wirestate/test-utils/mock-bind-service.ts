import { Container, type Newable, type ServiceIdentifier } from "inversify";

import { AbstractService, bindService } from "@/wirestate";

export interface IMockBindServiceOptions {
  token?: ServiceIdentifier;
  skipLifecycle?: boolean;
}

// todo: This method does not instantiate, just binds.
export function mockBindService<T extends AbstractService>(
  container: Container,
  ServiceClass: Newable<T>,
  options: IMockBindServiceOptions = {}
): void {
  const { token, skipLifecycle } = options;

  return token
    ? bindService(container, token as ServiceIdentifier<T>, ServiceClass, false, skipLifecycle)
    : bindService(container, ServiceClass, ServiceClass, false, skipLifecycle);
}
