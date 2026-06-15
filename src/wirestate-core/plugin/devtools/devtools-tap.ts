import type { Container } from "../../container/container";
import type { Newable, Optional } from "../../types/general";
import { CommandBus } from "../commands/command-bus";
import { EventBus } from "../events/event-bus";
import type { WireEvent } from "../events/events";
import { QueryBus } from "../queries/query-bus";

import type { DevtoolsMessage, DevtoolsMessageChannel } from "./devtools-hook";

/**
 * Bus instances already tapped, so a shared/inherited bus is observed at most once
 * across every container and plugin instance on the page.
 */
const TAPPED: WeakSet<object> = new WeakSet();

/**
 * Taps the messaging buses a container resolves, so dispatches flow to the hook.
 *
 * @remarks
 * Non-intrusive and idempotent. `EventBus` is observed with a catch-all subscription;
 * `CommandBus` / `QueryBus` are single-dispatch (`peek` — newest handler only), so
 * their public dispatch methods are wrapped to report and then forward to the
 * original. A bus is tapped once and never untapped — the tap lives on the bus
 * instance and is collected with it, so devtools never extends a lifetime.
 *
 * @param container - Container whose resolved buses to tap.
 * @param emit - Reports one observed message.
 */
export function tapContainerBuses(container: Container, emit: (message: DevtoolsMessage) => void): void {
  tapEventBus(container, emit);
  tapDispatchBus(
    container,
    CommandBus,
    "command",
    ["execute", "executeAsync", "executeOptional", "executeOptionalAsync"],
    emit
  );
  tapDispatchBus(container, QueryBus, "query", ["query", "queryAsync", "queryOptional", "queryOptionalAsync"], emit);
}

/**
 * Subscribes a catch-all observer to a container's `EventBus`, once.
 *
 * @param container - Container resolving the bus.
 * @param emit - Reports one observed message.
 */
function tapEventBus(container: Container, emit: (message: DevtoolsMessage) => void): void {
  const bus: Optional<EventBus> = container.get(EventBus, { optional: true });

  if (!bus || TAPPED.has(bus)) {
    return;
  }

  TAPPED.add(bus);

  bus.subscribe(null, (event: WireEvent): void => {
    emit({
      channel: "event",
      type: String(event.type),
      payload: event.payload,
      source: event.source,
      timestamp: Date.now(),
    });
  });
}

/**
 * Wraps a single-dispatch bus's public dispatch methods to observe traffic, once.
 *
 * @param container - Container resolving the bus.
 * @param token - Bus token to resolve.
 * @param channel - Channel the bus represents.
 * @param methods - Public dispatch method names to wrap.
 * @param emit - Reports one observed message.
 */
function tapDispatchBus(
  container: Container,
  token: Newable<object>,
  channel: DevtoolsMessageChannel,
  methods: ReadonlyArray<string>,
  emit: (message: DevtoolsMessage) => void
): void {
  const bus: Optional<object> = container.get(token, { optional: true });

  if (!bus || TAPPED.has(bus)) {
    return;
  }

  TAPPED.add(bus);

  const target: Record<string, (type: unknown, payload?: unknown) => unknown> = bus as Record<
    string,
    (type: unknown, payload?: unknown) => unknown
  >;

  for (const name of methods) {
    if (typeof target[name] !== "function") {
      continue;
    }

    const original: (type: unknown, payload?: unknown) => unknown = target[name].bind(bus);

    target[name] = (type: unknown, payload?: unknown): unknown => {
      emit({ channel, type: String(type), payload, source: undefined, timestamp: Date.now() });

      return original(type, payload);
    };
  }
}
