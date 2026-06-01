import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container, Newable } from "../../alias";
import { reportWirestateInternalError } from "../../error/internal-error-handler";
import { CONTAINER_REFS_BY_SERVICE } from "../../registry";
import { getDeactivationHandlerMetadata } from "../../service/on-deactivation";
import { Maybe, MaybePromise } from "../../types/general";
import type { BindInstanceOptions } from "../bind-instance";

import { unregisterInstanceHandlers } from "./instance-handlers";
import { detachScopes } from "./instance-scopes";

interface CreateServiceDeactivationHandlerOptions<T extends object> {
  readonly binding: Newable<T>;
  readonly container: Container;
  readonly options?: BindInstanceOptions;
}

/**
 * Creates the Inversify deactivation hook for a Wirestate service binding.
 *
 * @internal
 *
 * @template T - Service instance type.
 *
 * @param handlerOptions - Deactivation handler options.
 * @returns Inversify deactivation handler.
 */
export function createInstanceDeactivationHandler<T extends object>(
  handlerOptions: CreateServiceDeactivationHandlerOptions<T>
): (instance: T) => void {
  const { binding, container, options } = handlerOptions;

  return (instance: T): void => {
    dbg.info(prefix(__filename), "Deactivating service:", {
      name: binding.name,
      container,
      instance,
    });

    if (options?.skipLifecycle) {
      dbg.info(prefix(__filename), "Skip lifecycle @OnDeactivation method:", {
        name: binding.name,
        container,
        binding,
        instance,
        options,
      });
    } else {
      onInstanceDeactivation(container, binding, instance);
    }

    detachScopes(instance);
    unregisterInstanceHandlers(instance);

    CONTAINER_REFS_BY_SERVICE.delete(instance);
  };
}

function onInstanceDeactivation<T extends object>(container: Container, binding: Newable<T>, instance: T): void {
  const methodName: Maybe<string | symbol> = getDeactivationHandlerMetadata(instance);

  if (!methodName) {
    return;
  }

  try {
    const method: unknown = (instance as unknown as Record<string | symbol, unknown>)[methodName];

    if (typeof method === "function") {
      const result: MaybePromise<void> = (method as () => MaybePromise<void>).call(instance);

      if (result && typeof (result as Promise<void>).then === "function") {
        (result as Promise<void>).catch((error) => {
          reportWirestateInternalError({
            container,
            details: [binding.name, String(methodName)],
            error,
            message: "@OnDeactivation rejected",
            methodName,
            instance: instance,
            instanceName: binding.name,
            source: "service-deactivation",
          });
        });
      }
    }
  } catch (error) {
    reportWirestateInternalError({
      container,
      details: [binding.name, String(methodName)],
      error,
      message: "@OnDeactivation failed",
      methodName,
      instance: instance,
      instanceName: binding.name,
      source: "service-deactivation",
    });

    // No rethrow on deactivation.
  }
}
