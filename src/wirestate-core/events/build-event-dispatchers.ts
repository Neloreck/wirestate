import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container } from "../alias";
import { reportWirestateInternalError } from "../error/internal-error-handler";
import { EventDispatch, EventHandler, EventType } from "../types/events";
import { Maybe } from "../types/general";

import { getEventHandlerMetadata } from "./get-event-handler-metadata";

/**
 * Accumulates a single method's merged `@OnEvent` decorations during a build pass.
 *
 * @internal
 */
interface DispatcherPlan {
  readonly invoke: EventHandler;
  readonly types: Set<EventType>;
  catchAll: boolean;
}

/**
 * Builds one bus subscription descriptor per `@OnEvent` method on a service.
 *
 * @remarks
 * Scans the instance for methods decorated with {@link OnEvent} and returns a
 * descriptor for each, pairing the method's event types with an error-isolating
 * handler. Each descriptor is subscribed independently, so the bus indexes every
 * method directly under its own types.
 *
 * All `@OnEvent` decorations of the same method are merged into a single
 * subscription: their types are unioned, and any catch-all decoration makes the
 * whole method catch-all. A method is therefore invoked at most once per event,
 * regardless of how many times it was decorated. Methods keep parent-to-child
 * first-seen order.
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
 * for (const dispatch of buildEventDispatchers(myServiceInstance)) {
 *   eventBus.subscribe(dispatch.types, dispatch.handler);
 * }
 * ```
 */
export function buildEventDispatchers<T extends object>(
  instance: T,
  container?: Container
): ReadonlyArray<EventDispatch> {
  dbg.info(prefix(__filename), "Build event dispatchers for:", { name: instance.constructor.name, instance });

  // Merge every @OnEvent decoration of the same method into one plan, keyed by
  // method name in parent-to-child first-seen order.
  const plans: Map<string | symbol, DispatcherPlan> = new Map();

  for (const meta of getEventHandlerMetadata(instance)) {
    const method = (instance as unknown as Record<string | symbol, unknown>)[meta.methodName];

    if (typeof method !== "function") {
      continue;
    }

    let plan: Maybe<DispatcherPlan> = plans.get(meta.methodName);

    if (!plan) {
      plan = { invoke: (method as EventHandler).bind(instance), types: new Set(), catchAll: false };
      plans.set(meta.methodName, plan);
    }

    if (meta.types === null) {
      plan.catchAll = true;
    } else {
      for (const type of meta.types) {
        plan.types.add(type);
      }
    }
  }

  const dispatchers: Array<EventDispatch> = [];

  for (const plan of plans.values()) {
    dispatchers.push({
      types: plan.catchAll ? null : Array.from(plan.types),
      handler: (event) => {
        try {
          plan.invoke(event);
        } catch (error) {
          // Isolate each method so one failure cannot stall the others.
          reportWirestateInternalError({
            container,
            error,
            event,
            message: "Event handler threw",
            instance: instance,
            instanceName: instance.constructor.name,
            source: "instance-event-handler",
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
