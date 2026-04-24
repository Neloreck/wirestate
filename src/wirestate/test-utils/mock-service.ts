import { Newable } from "inversify";

import { mockBindService } from "@/wirestate/test-utils/mock-bind-service";
import { mockContainer } from "@/wirestate/test-utils/mock-container";

export interface IMockServiceOptions {
  skipLifecycle?: boolean;
}

// todo: This method instantiates and binds.
export function mockService<T extends object>(
  service: Newable<T>,
  container = mockContainer(),
  options: IMockServiceOptions = {}
): T {
  mockBindService(container, service, {
    skipLifecycle: options.skipLifecycle,
  });

  return container.get(service) as T;
}
