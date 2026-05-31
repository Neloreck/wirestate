import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container } from "../alias";
import { reportWirestateInternalError } from "../error/internal-error-handler";
import { EventDispatch, EventHandler } from "../types/events";

import { getEventHandlerMetadata } from "./get-event-handler-metadata";

/**
 * Builds one bus subscription descriptor per `@OnEvent` method on a service.
 *
 * @remarks
 * Scans the instance for methods decorated with {@link OnEvent} and returns a
 * descriptor for each, pairing the method's event types with an error-isolating
 * handler. Each descriptor is subscribed independently, so the bus indexes every
 * method directly under its own types.
 *
 * @group Events
 * @internal
 *
 * @template T - Type of the service instance.
 *
 * @param instance - Service instance to scan for handlers.
 * @param container - Container that owns the service instance.
 * @returns One subscription descriptor per decorated method; empty when none are declared.
 *
 * @example
 * ```typescript
 * for (const dispatch of buildEventDispatcher(myServiceInstance)) {
 *   eventBus.subscribe(dispatch.types, dispatch.handler);
 * }
 * ```
 */
export function buildEventDispatchers<T extends object>(
  instance: T,
  container?: Container
): ReadonlyArray<EventDispatch> {
  dbg.info(prefix(__filename), "Build event dispatchers for:", { name: instance.constructor.name, instance });

  const dispatchers: Array<EventDispatch> = [];

  // One subscription per @OnEvent method, kept in parent-to-child order.
  for (const meta of getEventHandlerMetadata(instance)) {
    const method = (instance as unknown as Record<string | symbol, unknown>)[meta.methodName];

    if (typeof method !== "function") {
      continue;
    }

    const handler: EventHandler = (method as EventHandler).bind(instance);

    dispatchers.push({
      types: meta.types,
      handler: (event) => {
        try {
          handler(event);
        } catch (error) {
          // Isolate each method so one failure cannot stall the others.
          reportWirestateInternalError({
            container,
            error,
            event,
            message: "Event handler threw",
            service: instance,
            serviceName: instance.constructor.name,
            source: "service-event-handler",
          });
        }
      },
    });
  }

  dbg.info(prefix(__filename), "Built event dispatchers for:", {
    name: instance.constructor.name,
    instance,
    dispatchers,
  });

  return dispatchers;
}
