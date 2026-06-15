import type { Container } from "../../container/container";
import type { Newable, Optional } from "../../types/general";
import { CommandBus } from "../commands/command-bus";
import { EventBus } from "../events/event-bus";
import type { WireEvent } from "../events/events";
import { QueryBus } from "../queries/query-bus";

import type { DevtoolsMessage, DevtoolsMessageChannel, DevtoolsRegistration } from "./devtools-hook";

/**
 * Where a tapped bus reports observed traffic.
 *
 * @group DevTools
 */
export interface DevtoolsTapSink {
  /**
   * Reports one dispatched message (event emitted, command/query dispatched).
   */
  message(message: DevtoolsMessage): void;

  /**
   * Reports one handler/subscriber registration or unregistration.
   */
  registration(registration: DevtoolsRegistration): void;
}

/**
 * A bus method, loosely typed for wrapping.
 */
type BusMethod = (...args: Array<unknown>) => unknown;

/**
 * Bus instances already tapped, so a shared/inherited bus is observed at most once
 * across every container and plugin instance on the page.
 */
const TAPPED: WeakSet<object> = new WeakSet();

/**
 * `CommandBus` public dispatch methods wrapped to observe traffic.
 */
const COMMAND_METHODS: ReadonlyArray<string> = ["execute", "executeAsync", "executeOptional", "executeOptionalAsync"];

/**
 * `QueryBus` public dispatch methods wrapped to observe traffic.
 */
const QUERY_METHODS: ReadonlyArray<string> = ["query", "queryAsync", "queryOptional", "queryOptionalAsync"];

/**
 * Taps the messaging buses a container resolves, so dispatches and handler
 * registrations flow to the sink.
 *
 * @remarks
 * Non-intrusive and idempotent. Each bus is tapped once and never untapped — the tap
 * lives on the bus instance and is collected with it, so devtools never extends a
 * lifetime. `EventBus` dispatch is observed with a catch-all subscription;
 * `CommandBus` / `QueryBus` dispatch is observed by wrapping their public dispatch
 * methods. Handler registration is observed by wrapping `register`/`unregister`
 * (commands/queries) and `subscribe`/`unsubscribe` (events) — which captures decorated
 * handlers (wired at provision, after this tap installs) and imperative ones alike.
 *
 * @param container - Container whose resolved buses to tap.
 * @param sink - Where to report observed messages and registrations.
 */
export function tapContainerBuses(container: Container, sink: DevtoolsTapSink): void {
  tapEventBus(container, sink);
  tapDispatchBus(container, CommandBus, "command", COMMAND_METHODS, sink);
  tapDispatchBus(container, QueryBus, "query", QUERY_METHODS, sink);
}

/**
 * Observes a container's `EventBus`, once: catch-all dispatch plus subscribe/unsubscribe
 * registration.
 *
 * @param container - Container resolving the bus.
 * @param sink - Where to report observed traffic.
 */
function tapEventBus(container: Container, sink: DevtoolsTapSink): void {
  const bus: Optional<EventBus> = container.get(EventBus, { optional: true });

  if (!bus || TAPPED.has(bus)) {
    return;
  }

  TAPPED.add(bus);

  // Capture originals before wrapping; the dispatch tap uses the original subscribe so
  // it is not reported as a handler registration.
  const target: Record<string, BusMethod> = bus as unknown as Record<string, BusMethod>;
  const originalSubscribe: BusMethod = target.subscribe.bind(bus);
  const originalUnsubscribe: BusMethod = target.unsubscribe.bind(bus);

  originalSubscribe(null, (event: WireEvent): void => {
    sink.message({
      channel: "event",
      type: String(event.type),
      payload: event.payload,
      source: event.source,
      timestamp: Date.now(),
    });
  });

  target.subscribe = (typesOrHandler: unknown, handler?: unknown): (() => void) => {
    const types: ReadonlyArray<string> = resolveEventTypes(typesOrHandler, handler);

    reportEach(sink, "event", types, "registered");

    const unsubscribe: () => void = originalSubscribe(typesOrHandler, handler) as () => void;

    return (): void => {
      reportEach(sink, "event", types, "unregistered");
      unsubscribe();
    };
  };

  target.unsubscribe = (typesOrHandler: unknown, handler?: unknown): void => {
    reportEach(sink, "event", resolveEventTypes(typesOrHandler, handler), "unregistered");
    originalUnsubscribe(typesOrHandler, handler);
  };
}

/**
 * Observes a single-dispatch bus, once: dispatch-method wrapping plus register/unregister
 * registration.
 *
 * @param container - Container resolving the bus.
 * @param token - Bus token to resolve.
 * @param channel - Channel the bus represents.
 * @param methods - Public dispatch method names to wrap.
 * @param sink - Where to report observed traffic.
 */
function tapDispatchBus(
  container: Container,
  token: Newable<object>,
  channel: DevtoolsMessageChannel,
  methods: ReadonlyArray<string>,
  sink: DevtoolsTapSink
): void {
  const bus: Optional<object> = container.get(token, { optional: true });

  if (!bus || TAPPED.has(bus)) {
    return;
  }

  TAPPED.add(bus);

  const target: Record<string, BusMethod> = bus as unknown as Record<string, BusMethod>;

  for (const name of methods) {
    if (typeof target[name] !== "function") {
      continue;
    }

    const original: BusMethod = target[name].bind(bus);

    target[name] = (type: unknown, payload?: unknown): unknown => {
      sink.message({ channel, type: String(type), payload, source: undefined, timestamp: Date.now() });

      return original(type, payload);
    };
  }

  const originalRegister: BusMethod = target.register.bind(bus);
  const originalUnregister: BusMethod = target.unregister.bind(bus);

  target.register = (type: unknown, handler?: unknown): (() => void) => {
    sink.registration({ channel, type: String(type), phase: "registered" });

    const unregister: () => void = originalRegister(type, handler) as () => void;

    return (): void => {
      sink.registration({ channel, type: String(type), phase: "unregistered" });
      unregister();
    };
  };

  target.unregister = (type: unknown, handler?: unknown): void => {
    sink.registration({ channel, type: String(type), phase: "unregistered" });
    originalUnregister(type, handler);
  };
}

/**
 * Resolves the event types a subscribe/unsubscribe call targets, mirroring the bus
 * overloads: a lone handler is catch-all (`"*"`); otherwise the first argument is the
 * type(s).
 *
 * @param typesOrHandler - First argument of the call.
 * @param handler - Second argument, present for the typed overload.
 * @returns The stringified types, or `["*"]` for a catch-all.
 */
function resolveEventTypes(typesOrHandler: unknown, handler: unknown): ReadonlyArray<string> {
  if (handler === undefined || typesOrHandler === null || typesOrHandler === undefined) {
    return ["*"];
  }

  if (Array.isArray(typesOrHandler)) {
    return typesOrHandler.map((type: unknown): string => String(type));
  }

  return [String(typesOrHandler)];
}

/**
 * Reports one registration delta per type to the sink.
 *
 * @param sink - Where to report.
 * @param channel - Channel the registration is on.
 * @param types - Types covered by the registration.
 * @param phase - Whether the handler was registered or unregistered.
 */
function reportEach(
  sink: DevtoolsTapSink,
  channel: DevtoolsMessageChannel,
  types: ReadonlyArray<string>,
  phase: DevtoolsRegistration["phase"]
): void {
  for (const type of types) {
    sink.registration({ channel, type, phase });
  }
}
