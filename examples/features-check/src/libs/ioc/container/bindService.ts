import { Container, type Newable, type ServiceIdentifier } from "inversify";

import { getQueryHandlerMetadata } from "../queries/getQueryHandlerMetadata";
import { QueryBus } from "../queries/QueryBus";
import {
  CONTAINER_REFS_BY_SERVICE,
  QUERY_BUS_TOKEN,
  QUERY_UNREGISTERS_BY_SERVICE,
  SIGNAL_BUS_TOKEN,
  SIGNAL_UNSUBSCRIBERS_BY_SERVICE,
} from "../registry";
import { AbstractService } from "../service/AbstractService";
import { buildSignalDispatcher } from "../signals/buildSignalDispatcher";
import type { SignalBus } from "../signals/SignalBus";
import type { TQueryHandler, TQueryUnregister } from "../types/queries";
import type { TSignalHandler } from "../types/signals";

/**
 * Registers an AbstractService in the container with activation/deactivation logic.
 * Ensures container references, signal subscriptions, and query handlers are managed correctly.
 *
 * @param container - target Inversify container
 * @param token - service identifier
 * @param ServiceClass - service constructor
 * @param isOnceBind - if true, skips binding if the token is already bound
 */
export function bindService<T extends AbstractService>(
  container: Container,
  token: ServiceIdentifier<T>,
  ServiceClass: Newable<T>,
  isOnceBind?: boolean,
): void {
  if (isOnceBind && container.isBound(token)) {
    return;
  }

  container.bind<T>(token).to(ServiceClass).inSingletonScope();

  // Inversify's fluent binding API only allows a single `.onActivation` /
  // `.onDeactivation` call per chain, so we register them on the container
  // itself instead — this also works correctly if a later call rebinds the
  // same token.
  container.onActivation<T>(token, (_ctx, instance) => {
    CONTAINER_REFS_BY_SERVICE.set(instance, container);

    // Compose all signal listeners (the catch-all `onSignal` hook plus every
    // `@OnSignal`-decorated method) into a single bus subscription so we only
    // pay one Set lookup per emitted signal.
    const dispatcher = buildSignalDispatcher(instance);

    if (dispatcher) {
      _attachSignalSub(instance, dispatcher);
    }

    // Register every `@OnQuery` handler on the container's QueryBus, and
    // remember the unregister functions so we can roll them back when the
    // service is deactivated.
    const queryBus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);

    for (const meta of getQueryHandlerMetadata(instance)) {
      const method = (instance as unknown as Record<string | symbol, unknown>)[
        meta.methodName
      ];

      if (typeof method !== "function") {
        continue;
      }

      const unregister = queryBus.register(
        meta.type,
        (method as TQueryHandler).bind(instance),
      );

      _attachQueryUnreg(instance, unregister);
    }

    const result = instance.onActivated();

    // Fire-and-forget any async init so we stay synchronous from the
    // container's point of view. Services that need strict async
    // bootstrapping can await their initialization elsewhere.
    if (result && typeof (result as Promise<void>).then === "function") {
      (result as Promise<void>).catch((error) => {
        console.error(
          "[ioc] onActivated rejected for",
          ServiceClass.name,
          error,
        );
      });
    }

    return instance;
  });

  container.onDeactivation<T>(token, (instance) => {
    // Flip the public disposal flag first so any async work already in
    // flight (fetches awaiting in @Action methods, scheduled reactions,
    // etc.) can short-circuit before it mutates the about-to-die instance.
    // The cast is the only write-site for this `readonly` field.
    // todo: Kill signalling methods of disposed instances, unlink containers?
    (instance as { IS_DISPOSED: boolean }).IS_DISPOSED = true;

    _detachQueryUnregs(instance);
    _detachSignalSub(instance);
    CONTAINER_REFS_BY_SERVICE.delete(instance);

    return instance.onDeactivated();
  });
}

/**
 * Attaches a signal subscription to a service.
 * @internal
 */
export function _attachSignalSub(
  service: AbstractService,
  handler: TSignalHandler,
): void {
  const bus =
    CONTAINER_REFS_BY_SERVICE.get(service)?.get<SignalBus>(SIGNAL_BUS_TOKEN);

  if (!bus) {
    return;
  }

  const unsub = bus.subscribe(handler);
  SIGNAL_UNSUBSCRIBERS_BY_SERVICE.set(service, unsub);
}

/**
 * Detaches the signal subscription from a service.
 * @internal
 */
export function _detachSignalSub(service: AbstractService): void {
  const unsub = SIGNAL_UNSUBSCRIBERS_BY_SERVICE.get(service);

  if (unsub) {
    unsub();
    SIGNAL_UNSUBSCRIBERS_BY_SERVICE.delete(service);
  }
}

/**
 * Registers a query unregister function for a service.
 * @internal
 */
export function _attachQueryUnreg(
  service: AbstractService,
  unregister: TQueryUnregister,
): void {
  let list = QUERY_UNREGISTERS_BY_SERVICE.get(service);

  if (!list) {
    list = [];
    QUERY_UNREGISTERS_BY_SERVICE.set(service, list);
  }

  list.push(unregister);
}

/**
 * Executes and removes all query unregister functions for a service.
 * @internal
 */
export function _detachQueryUnregs(service: AbstractService): void {
  const list = QUERY_UNREGISTERS_BY_SERVICE.get(service);

  if (!list) {
    return;
  }

  for (const unreg of list) {
    try {
      unreg();
    } catch (error) {
      console.error("[ioc] query unregister threw:", error);
    }
  }

  QUERY_UNREGISTERS_BY_SERVICE.delete(service);
}
