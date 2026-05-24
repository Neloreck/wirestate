import { BindingType, Container, getEntryToken, ServiceIdentifier, InjectableEntries } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Maybe, MaybePromise } from "../types/general";

import { getDeprovisionHandlerMetadata } from "./on-deprovision";
import { getProvisionHandlerMetadata } from "./on-provision";

/**
 * Tracks provider lifecycle state for containers owned by React providers.
 *
 * @group Provision
 * @internal
 */
export interface ProvisionLifecycle {
  /**
   * Containers waiting for delayed destruction after React cleanup.
   */
  readonly pendingDestruction: Map<Container, ReturnType<typeof setTimeout>>;

  /**
   * Services resolved for provider lifecycle hooks by container.
   */
  readonly provisionedServices: Map<Container, Array<object>>;
}

/**
 * Cancels delayed destruction for a container that survived a React effect cleanup.
 *
 * @group Provision
 * @internal
 *
 * @param container - Container to retain.
 * @param lifecycle - Provider lifecycle state.
 */
export function retainContainer(container: Container, lifecycle: ProvisionLifecycle): void {
  const timeout: Maybe<ReturnType<typeof setTimeout>> = lifecycle.pendingDestruction.get(container);

  if (timeout) {
    dbg.info(prefix(__filename), "Retaining container:", { container });

    clearTimeout(timeout);
    lifecycle.pendingDestruction.delete(container);
  }
}

/**
 * Resolves provider lifecycle services and calls their provision hooks once per provision cycle.
 *
 * @group Provision
 * @internal
 *
 * @param container - Container that owns the entries.
 * @param lifecycle - Provider lifecycle state.
 * @param entries - Entries controlled by the React provider.
 */
export function provisionContainer(
  container: Container,
  lifecycle: ProvisionLifecycle,
  entries: InjectableEntries = []
): void {
  if (lifecycle.provisionedServices.has(container)) {
    return;
  }

  const services: Array<object> = provisionServices(container, entries);

  if (services.length) {
    dbg.info(prefix(__filename), "Provisioning container:", {
      container,
      services,
    });
  }

  lifecycle.provisionedServices.set(container, services);
}

/**
 * Calls deprovision hooks for services provisioned in the current provision cycle.
 *
 * @group Provision
 * @internal
 *
 * @param container - Container being removed from provider ownership.
 * @param lifecycle - Provider lifecycle state.
 */
export function deprovisionContainer(container: Container, lifecycle: ProvisionLifecycle): void {
  const services: Maybe<Array<object>> = lifecycle.provisionedServices.get(container);

  if (services) {
    if (services.length) {
      dbg.info(prefix(__filename), "Deprovisioning container:", {
        container,
        services,
      });
    }

    deprovisionServices(services);
    lifecycle.provisionedServices.delete(container);
  }
}

/**
 * Schedules container disposal after React has had a chance to recommit the same container.
 *
 * @group Provision
 * @internal
 *
 * @param container - Container to dispose if it is not retained.
 * @param lifecycle - Provider lifecycle state.
 */
export function scheduleContainerDestruction(container: Container, lifecycle: ProvisionLifecycle): void {
  if (lifecycle.pendingDestruction.has(container)) {
    return;
  }

  deprovisionContainer(container, lifecycle);

  dbg.info(prefix(__filename), "Scheduling container destruction:", { container });

  lifecycle.pendingDestruction.set(
    container,
    setTimeout(() => {
      dbg.info(prefix(__filename), "Destroying container:", { container });

      lifecycle.pendingDestruction.delete(container);
      container.unbindAll();
    }, 0)
  );
}

/**
 * Resolves services that declare provider lifecycle hooks and calls their provision hook.
 *
 * @group Provision
 * @internal
 *
 * @param container - Container that owns the entries.
 * @param entries - Entries controlled by the React provider.
 * @returns Services that were resolved for provider lifecycle management.
 */
export function provisionServices(container: Container, entries: InjectableEntries = []): Array<object> {
  const services: Array<object> = [];
  const visited: Set<ServiceIdentifier> = new Set();

  for (const entry of entries) {
    const token: ServiceIdentifier = getEntryToken(entry);
    const metadataToken: ServiceIdentifier = getProviderLifecycleMetadataToken(entry);

    if (visited.has(token) || !hasProviderLifecycleMetadata(metadataToken)) {
      continue;
    }

    visited.add(token);

    const service: object = container.get(token) as object;
    const methodName: Maybe<string | symbol> = getProvisionHandlerMetadata(service);

    if (methodName) {
      callLifecycleHandler(service, methodName, "@OnProvision");
    }

    services.push(service);
  }

  return services;
}

/**
 * Resolves the constructor that can own provider lifecycle metadata.
 *
 * @internal
 *
 * @param entry - Entry registered on the provider container.
 * @returns Service constructor for instance descriptors, otherwise the entry token.
 */
function getProviderLifecycleMetadataToken(entry: InjectableEntries[number]): ServiceIdentifier {
  if (typeof entry !== "function" && entry.bindingType === BindingType.Instance && typeof entry.value === "function") {
    return entry.value as ServiceIdentifier;
  }

  return getEntryToken(entry);
}

/**
 * Calls deprovision hooks for services previously resolved by {@link provisionServices}.
 *
 * @group Provision
 * @internal
 *
 * @param services - Services resolved during provider provisioning.
 */
export function deprovisionServices(services: ReadonlyArray<object>): void {
  for (let index: number = services.length - 1; index >= 0; index -= 1) {
    const methodName: Maybe<string | symbol> = getDeprovisionHandlerMetadata(services[index]);

    if (methodName) {
      callLifecycleHandler(services[index], methodName, "@OnDeprovision");
    }
  }
}

/**
 * Checks whether a service token declares provider lifecycle metadata.
 *
 * @internal
 *
 * @param token - Entry token to inspect.
 * @returns True when the token is a service constructor with provision or deprovision metadata.
 */
function hasProviderLifecycleMetadata(token: ServiceIdentifier): boolean {
  if (typeof token !== "function") {
    return false;
  }

  const prototype: Maybe<object> = token.prototype as Maybe<object>;

  if (!prototype) {
    return false;
  }

  return Boolean(getProvisionHandlerMetadata(prototype) || getDeprovisionHandlerMetadata(prototype));
}

/**
 * Calls a provider lifecycle handler and reports synchronous or asynchronous failures.
 *
 * @internal
 *
 * @param service - Service instance that owns the handler.
 * @param methodName - Handler method name.
 * @param decoratorName - Decorator name used in diagnostics.
 */
function callLifecycleHandler(service: object, methodName: string | symbol, decoratorName: string): void {
  const method: unknown = (service as Record<string | symbol, unknown>)[methodName];

  if (typeof method !== "function") {
    return;
  }

  dbg.info(prefix(__filename), "Calling provider lifecycle handler:", {
    name: service.constructor.name,
    service,
    methodName,
    decoratorName,
  });

  try {
    const result: MaybePromise<void> = (method as () => MaybePromise<void>).call(service);

    if (result && typeof (result as Promise<void>).then === "function") {
      (result as Promise<void>).catch((error) => {
        console.error(
          `[wirestate-react] ${decoratorName} rejected for:`,
          service.constructor.name,
          String(methodName),
          error
        );
      });
    }
  } catch (error) {
    console.error(
      `[wirestate-react] ${decoratorName} failed for:`,
      service.constructor.name,
      String(methodName),
      error
    );
  }
}
