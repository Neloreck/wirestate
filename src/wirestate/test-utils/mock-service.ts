import { ServiceIdentifier } from "inversify";

import { mockBindService } from "@/wirestate/test-utils/mock-bind-service";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { TServiceClass } from "@/wirestate/types/services";

export interface IMockServiceOptions {
  token?: ServiceIdentifier;
  skipLifecycle?: boolean;
}

// todo: This method instantiates and binds.
export function mockService<T extends TServiceClass>(
  service: T,
  container = mockContainer(),
  options: IMockServiceOptions = {}
): InstanceType<T> {
  mockBindService(container, service, {
    skipLifecycle: options.skipLifecycle,
    token: options.token,
  });

  return container.get(service) as InstanceType<T>;
}
