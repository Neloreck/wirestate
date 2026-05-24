import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, ServiceIdentifier } from "../alias";
import { getEntryToken } from "../bind/get-entry-token";
import { Maybe, MaybePromise } from "../types/general";
import { InjectableEntries } from "../types/provision";

import { getDeprovisionHandlerMetadata } from "./on-deprovision";
import { getProvisionHandlerMetadata } from "./on-provision";

/**
 * Tracks provider lifecycle services by container for framework adapters.
 *
 * @group Service
 */
export type ProvisionLifecycle = Map<Container, Array<object>>;

/**
 * Resolves provider lifecycle services and calls their provision hooks once per provision cycle.
 *
 * @remarks
 * Framework adapters call this when a container becomes available to a UI
 * subtree. Lifecycle services are resolved even if the container was not
 * otherwise eagerly activated, so `@OnActivated` still runs before
 * `@OnProvision`.
 *
 * @group Service
 *
 * @param container - Container that owns the entries.
 * @param lifecycle - Provider lifecycle state.
 * @param entries - Entries controlled by the provider.
 */
export function provisionContainer(
  container: Container,
  lifecycle: ProvisionLifecycle,
  entries: InjectableEntries = []
): void {
  if (lifecycle.has(container)) {
    return;
  }

  const services: Array<object> = provisionServices(container, entries);

  dbg.info(prefix(__filename), "Provisioning container:", {
    container,
    services,
  });

  lifecycle.set(container, services);
}

/**
 * Calls deprovision hooks for services provisioned in the current provision cycle.
 *
 * @group Service
 *
 * @param container - Container being removed from provider ownership.
 * @param lifecycle - Provider lifecycle state.
 */
export function deprovisionContainer(container: Container, lifecycle: ProvisionLifecycle): void {
  const services: Maybe<Array<object>> = lifecycle.get(container);

  if (services) {
    dbg.info(prefix(__filename), "Deprovisioning container:", {
      container,
      services,
    });

    deprovisionServices(services);
    lifecycle.delete(container);
  }
}

/**
 * Resolves services that declare provider lifecycle hooks, then calls their provision hook.
 *
 * @remarks
 * Provisioning is intentionally split into two phases: all provider lifecycle
 * services are first resolved so activation completes, then `@OnProvision`
 * hooks run in entry order.
 *
 * @group Service
 *
 * @param container - Container that owns the entries.
 * @param entries - Entries controlled by the provider.
 * @returns Services that were resolved for provider lifecycle management.
 */
export function provisionServices(container: Container, entries: InjectableEntries = []): Array<object> {
  const services: Array<object> = [];
  const visited: Set<ServiceIdentifier> = new Set();

  for (const entry of entries) {
    const token: ServiceIdentifier = getEntryToken(entry);
    const metadataToken: ServiceIdentifier = getProviderLifecycleMetadataToken(entry);

    if (!visited.has(token) && hasProviderLifecycleMetadata(metadataToken)) {
      visited.add(token);
      services.push(container.get(token) as object);
    }
  }

  for (const service of services) {
    const methodName: Maybe<string | symbol> = getProvisionHandlerMetadata(service);

    if (methodName) {
      callLifecycleHandler(service, methodName, "@OnProvision");
    }
  }

  return services;
}

/**
 * Calls deprovision hooks for services previously resolved by {@link provisionServices}.
 *
 * @group Service
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
          "[wirestate] " + decoratorName + " rejected for:",
          service.constructor.name,
          String(methodName),
          error
        );
      });
    }
  } catch (error) {
    console.error("[wirestate] " + decoratorName + " failed for:", service.constructor.name, String(methodName), error);
  }
}
