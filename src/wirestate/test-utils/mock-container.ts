import { Container, ServiceIdentifier } from "inversify";

import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { ERROR_CODE_INVALID_ARGUMENTS } from "@/wirestate/core/error/error-code";
import { WirestateError } from "@/wirestate/core/error/wirestate-error";
import { mockBindService } from "@/wirestate/test-utils/mock-bind-service";
import { TServiceClass } from "@/wirestate/types/services";

export interface IMockContainerOptions {
  services?: Array<TServiceClass>;
  activate?: Array<ServiceIdentifier>;
  skipLifecycle?: boolean;
}

export function mockContainer(options: IMockContainerOptions = {}): Container {
  const container: Container = createIocContainer();

  const { activate = [], services = [] } = options;

  if (activate.length) {
    for (const token of options.activate ?? []) {
      if (!services.includes(token as TServiceClass)) {
        throw new WirestateError(
          ERROR_CODE_INVALID_ARGUMENTS,
          "Provided services for activation not matching list of services to bind."
        );
      }
    }
  }

  for (const service of options.services ?? []) {
    mockBindService(container, service, { skipLifecycle: options.skipLifecycle });
  }

  for (const token of options.activate ?? []) {
    container.get(token);
  }

  return container;
}
