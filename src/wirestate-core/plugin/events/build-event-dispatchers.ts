import { type ContainerKernel } from "../../container/container-kernel";
import { reportWirestateInternalError } from "../../error/internal-error-handler";
import { type Maybe } from "../../types/general";

import { type EventDispatch, type EventHandler, type EventType } from "./events";
import { getEventHandlerMetadata } from "./events-registry";

/**
 * Accumulates a single method's merged `@OnEvent` decorations during a build pass.
 *
 * @internal
 */
interface DispatcherPlan {
  readonly invoke: EventHandler;
  readonly methodName: string | symbol;
  readonly types: Set<EventType>;
  catchAll: boolean;
}

/**
 * Builds one bus subscription descriptor per `@OnEvent` method on an instance.
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
 * @template T - Type of the instance.
 *
 * @param instance - The instance to scan for handlers.
 * @param container - ContainerKernel that owns the instance.
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
  container?: ContainerKernel
): ReadonlyArray<EventDispatch> {
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
      plan = {
        invoke: (method as EventHandler).bind(instance),
        methodName: meta.methodName,
        types: new Set(),
        catchAll: false,
      };
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
            methodName: plan.methodName,
            instance: instance,
            instanceName: instance.constructor.name,
            source: "instance-event-handler",
          });
        }
      },
    });
  }

  return dispatchers;
}
