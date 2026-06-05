import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container, Newable } from "../../alias";
import { callLifecycleHandler } from "../../lifecycle/call-lifecycle-handler";
import { CONTAINER_REFS_BY_INSTANCE } from "../../registry";
import { Maybe } from "../../types/general";
import { BindOptions } from "../bind";

import { unregisterInstanceHandlers } from "./instance-handlers";
import { detachScopes } from "./instance-scopes";
import { getDeactivationHandlerMetadata } from "./on-deactivation";

interface CreateInstanceDeactivationHandlerOptions<T extends object> {
  readonly binding: Newable<T>;
  readonly container: Container;
  readonly options?: BindOptions;
}

/**
 * Creates the Inversify deactivation hook for a Wirestate instance binding.
 *
 * @internal
 *
 * @template T - Instance type.
 *
 * @param handlerOptions - Deactivation handler options.
 * @returns Inversify deactivation handler.
 */
export function createInstanceDeactivationHandler<T extends object>(
  handlerOptions: CreateInstanceDeactivationHandlerOptions<T>
): (instance: T) => void {
  const { binding, container, options } = handlerOptions;

  return (instance: T): void => {
    dbg.info(prefix(__filename), "Deactivating instance:", {
      name: binding.name,
      container,
      instance,
    });

    if (options?.skipActivationHooks) {
      dbg.info(prefix(__filename), "Skip @OnDeactivation method:", {
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

    CONTAINER_REFS_BY_INSTANCE.delete(instance);
  };
}

function onInstanceDeactivation<T extends object>(container: Container, binding: Newable<T>, instance: T): void {
  const methodName: Maybe<string | symbol> = getDeactivationHandlerMetadata(instance);

  if (!methodName) {
    return;
  }

  callLifecycleHandler({
    container,
    name: "@OnDeactivation",
    details: [binding.name, String(methodName)],
    instance,
    instanceName: binding.name,
    methodName,
    source: "instance-deactivation",
  });
}
