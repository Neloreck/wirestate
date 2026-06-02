import type { ResolutionContext } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container, Newable } from "../../alias";
import { reportWirestateInternalError } from "../../error/internal-error-handler";
import { CONTAINER_REFS_BY_INSTANCE } from "../../registry";
import { Maybe, MaybePromise } from "../../types/general";
import type { BindInstanceOptions } from "../bind-instance";

import { unregisterInstanceHandlers, registerInstanceHandlers } from "./instance-handlers";
import { attachScopes, detachScopes } from "./instance-scopes";
import { getActivatedHandlerMetadata } from "./on-activated";

interface CreateInstanceActivationHandlerOptions<T extends object> {
  readonly binding: Newable<T>;
  readonly container: Container;
  readonly options?: BindInstanceOptions;
}

/**
 * Creates the Inversify activation hook for a Wirestate instance binding.
 *
 * @internal
 *
 * @template T - Instance type.
 *
 * @param handlerOptions - Activated handler options.
 * @returns Inversify activation handler.
 */
export function createInstanceActivatedHandler<T extends object>(
  handlerOptions: CreateInstanceActivationHandlerOptions<T>
): (context: ResolutionContext, instance: T) => T {
  const { binding, container, options } = handlerOptions;

  return (context: ResolutionContext, instance: T): T => {
    dbg.info(prefix(__filename), "Activating instance:", {
      name: binding.name,
      context,
      container,
      binding,
      instance,
      options,
    });

    try {
      CONTAINER_REFS_BY_INSTANCE.set(instance, container);

      attachScopes(instance, binding);
      registerInstanceHandlers(container, instance);

      if (options?.skipActivationHooks) {
        dbg.info(prefix(__filename), "Skip @OnActivated method:", {
          name: binding.name,
          context,
          container,
          binding,
          instance,
          options,
        });
      } else {
        onInstanceActivated(container, binding, instance);
      }

      return instance;
    } catch (error) {
      detachScopes(instance);
      unregisterInstanceHandlers(instance);

      CONTAINER_REFS_BY_INSTANCE.delete(instance);

      throw error;
    }
  };
}

function onInstanceActivated<T extends object>(container: Container, binding: Newable<T>, instance: T): void {
  const methodName: Maybe<string | symbol> = getActivatedHandlerMetadata(instance);

  if (!methodName) {
    return;
  }

  const method = (instance as unknown as Record<string | symbol, unknown>)[methodName];

  if (typeof method !== "function") {
    return;
  }

  const result: MaybePromise<void> = (method as () => MaybePromise<void>).call(instance);

  if (result && typeof (result as Promise<void>).then === "function") {
    (result as Promise<void>).catch((error) => {
      reportWirestateInternalError({
        container,
        details: [binding.name, String(methodName)],
        error,
        message: "@OnActivated rejected",
        methodName,
        instance: instance,
        instanceName: binding.name,
        source: "instance-activation",
      });
    });
  }
}
