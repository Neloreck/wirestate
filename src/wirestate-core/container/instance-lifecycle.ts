import type { InstanceBindingDescriptor } from "../binding/binding";
import { CommandBus } from "../commands/command-bus";
import { getCommandHandlerMetadata } from "../commands/get-command-handler-metadata";
import { buildEventDispatchers } from "../events/build-event-dispatchers";
import { EventBus } from "../events/event-bus";
import { callLifecycleHandler } from "../lifecycle/call-lifecycle-handler";
import { getActivatedHandlerMetadata } from "../lifecycle/on-activated";
import { getDeactivationHandlerMetadata } from "../lifecycle/on-deactivation";
import { getQueryHandlerMetadata } from "../queries/get-query-handler-metadata";
import { QueryBus } from "../queries/query-bus";
import { PROVISION_STATUS_BY_CONTAINER } from "../registry";
import type { CommandHandler } from "../types/commands";
import type { EventDispatch, EventUnsubscriber } from "../types/events";
import type { Maybe } from "../types/general";
import type { QueryHandler } from "../types/queries";

import type { ActivationRecord } from "./binding-storage";
import type { Container } from "./container";
import { WireStatus } from "./wire-status";

/**
 * Container-maintained mapping of activated service instances to their owning containers.
 *
 * Written at the container's activation commit point and cleared on deactivation,
 * so lookups never observe a partially activated instance.
 */
const INSTANCE_CONTAINERS: WeakMap<object, Container> = new WeakMap();

/**
 * Returns the container that activated a service instance.
 *
 * @param instance - Resolved service instance to look up.
 * @returns The owning container, or `undefined` when the instance is not active.
 */
export function getInstanceContainer(instance: object): Container | undefined {
  return INSTANCE_CONTAINERS.get(instance);
}

/**
 * Activates a service instance for an instance binding.
 *
 * @remarks
 * Runs the Wirestate side of instance activation: tracks the instance to
 * container mapping, initializes {@link WireStatus}, registers decorated
 * `@OnEvent`, `@OnQuery`, and `@OnCommand` handlers on the container's buses
 * (skipped gracefully when no buses are bound), and invokes the `@OnActivated`
 * hook unless the binding opted out with `skipActivationHooks`.
 *
 * Handler unregister callbacks are collected onto `record.disposers`, so a
 * failed activation can roll back with {@link rollbackInstanceActivation}.
 *
 * @param container - Container resolving the instance binding.
 * @param record - Activation record carrying the constructed instance.
 * @internal
 */
export function activateInstance(container: Container, record: ActivationRecord): void {
  const binding: InstanceBindingDescriptor<object> = record.binding as InstanceBindingDescriptor<object>;
  const instance: object = record.instance as object;

  INSTANCE_CONTAINERS.set(instance, container);

  initializeInstanceStatus(container, instance);
  registerInstanceHandlers(container, instance, record.disposers);

  if (binding.skipActivationHooks) {
    return;
  }

  const methodName: Maybe<string | symbol> = getActivatedHandlerMetadata(instance);

  if (methodName) {
    callLifecycleHandler({
      container,
      name: "@OnActivated",
      details: [binding.value.name, String(methodName)],
      instance,
      instanceName: binding.value.name,
      methodName,
      rethrowSync: true,
      source: "instance-activation",
    });
  }
}

/**
 * Deactivates a service instance for an instance binding.
 *
 * @remarks
 * Invokes the `@OnDeactivation` hook unless the binding opted out with
 * `skipActivationHooks`, marks the {@link WireStatus} as disposed, runs the
 * collected handler disposers, and clears the instance to container mapping.
 *
 * @param container - Container that owns the activation record.
 * @param record - Activation record of the instance being deactivated.
 * @internal
 */
export function deactivateInstance(container: Container, record: ActivationRecord): void {
  const binding: InstanceBindingDescriptor<object> = record.binding as InstanceBindingDescriptor<object>;
  const instance: object = record.instance as object;

  if (!binding.skipActivationHooks) {
    const methodName: Maybe<string | symbol> = getDeactivationHandlerMetadata(instance);

    if (methodName) {
      callLifecycleHandler({
        container,
        name: "@OnDeactivation",
        details: [binding.value.name, String(methodName)],
        instance,
        instanceName: binding.value.name,
        methodName,
        source: "instance-deactivation",
      });
    }
  }

  unregisterInstanceStatus(instance);
  runDisposers(record);

  INSTANCE_CONTAINERS.delete(instance);
}

/**
 * Rolls back a failed instance activation.
 *
 * @remarks
 * Marks the {@link WireStatus} as disposed, runs the disposers collected
 * before the failure, and clears the instance to container mapping. The
 * container drops the activation record, so no partial registration survives.
 *
 * @param container - Container whose activation failed.
 * @param record - Activation record of the instance that failed to activate.
 * @internal
 */
export function rollbackInstanceActivation(container: Container, record: ActivationRecord): void {
  const instance: object = record.instance as object;

  unregisterInstanceStatus(instance);
  runDisposers(record);

  INSTANCE_CONTAINERS.delete(instance);
}

/**
 * Starts lifecycle tracking for an activated instance.
 *
 * @param container - Owning container.
 * @param instance - Activated instance.
 * @internal
 */
export function initializeInstanceStatus(container: Container, instance: object): void {
  const status: WireStatus = WireStatus.for(instance, { initialize: true });

  status.isDisposed = false;

  const isProvisioned = PROVISION_STATUS_BY_CONTAINER.get(container);

  status.isDeprovisioned = isProvisioned === undefined ? null : !isProvisioned;
  status.provisionId = null;
}

/**
 * Marks an instance as deactivated.
 *
 * @param instance - Deactivated instance.
 * @internal
 */
export function unregisterInstanceStatus(instance: object): void {
  const status: WireStatus = WireStatus.for(instance);

  status.isDisposed = true;
  status.isDeprovisioned = true;
}

/**
 * Registers decorated event, query, and command handlers for an instance.
 *
 * @remarks
 * Buses are resolved by token with `{ optional: true }`, so containers without
 * messaging skip handler registration gracefully. Each registration's
 * unregister callback is collected into `disposers`.
 *
 * @param container - Container that owns the instance.
 * @param instance - Activated instance.
 * @param disposers - Collector for handler unregister callbacks.
 */
function registerInstanceHandlers(container: Container, instance: object, disposers: Array<() => void>): void {
  const dispatches: ReadonlyArray<EventDispatch> = buildEventDispatchers(instance, container);

  if (dispatches.length) {
    const eventBus: Maybe<EventBus> = container.get(EventBus, { optional: true });

    if (eventBus) {
      const unsubscribers: Array<EventUnsubscriber> = dispatches.map((dispatch) =>
        eventBus.subscribe(dispatch.types, dispatch.handler)
      );

      disposers.push(() => {
        for (const unsubscribe of unsubscribers) {
          unsubscribe();
        }
      });
    }
  }

  const queryHandlers = getQueryHandlerMetadata(instance);

  if (queryHandlers.length) {
    const queryBus: Maybe<QueryBus> = container.get(QueryBus, { optional: true });

    if (queryBus) {
      for (const meta of queryHandlers) {
        const method: unknown = (instance as Record<string | symbol, unknown>)[meta.methodName];

        if (typeof method !== "function") {
          continue;
        }

        disposers.push(queryBus.register(meta.type, (method as QueryHandler).bind(instance)));
      }
    }
  }

  const commandHandlers = getCommandHandlerMetadata(instance);

  if (commandHandlers.length) {
    const commandBus: Maybe<CommandBus> = container.get(CommandBus, { optional: true });

    if (commandBus) {
      for (const meta of commandHandlers) {
        const method: unknown = (instance as Record<string | symbol, unknown>)[meta.methodName];

        if (typeof method !== "function") {
          continue;
        }

        disposers.push(commandBus.register(meta.type, (method as CommandHandler).bind(instance)));
      }
    }
  }
}

/**
 * Invokes and clears the disposers collected on an activation record.
 *
 * @param record - Activation record being deactivated or rolled back.
 */
function runDisposers(record: ActivationRecord): void {
  for (const dispose of record.disposers) {
    dispose();
  }

  record.disposers.length = 0;
}
