import { Injectable } from "../../wirestate-core/alias";
import { OnActivated } from "../../wirestate-core/service/on-activated";
import { OnDeactivation } from "../../wirestate-core/service/on-deactivation";
import { OnDeprovision } from "../../wirestate-react/services/on-deprovision";
import { OnProvision } from "../../wirestate-react/services/on-provision";

/**
 * Lifecycle callback names supported by {@link createLifecycleService}.
 *
 * @remarks
 * The emitted event text uses the same value, optionally followed by the
 * configured suffix.
 */
export type ActivationLifecycleEvent = "activated" | "deactivation" | "provision" | "deprovision";

/**
 * Options used to create a lifecycle test service.
 *
 * @remarks
 * The generated service stores these options on static members so tests can
 * assert lifecycle order without keeping a resolved service instance.
 */
export interface CreateLifecycleServiceOptions {
  /**
   * Lifecycle callbacks that should append events when invoked.
   *
   * @remarks
   * Omitted callbacks still exist on the generated class, but they do not write
   * to the event log. This lets tests isolate one lifecycle phase without
   * changing the binding behavior of the service.
   *
   * @default ["activated", "deactivation", "provision", "deprovision"]
   */
  methods?: Array<ActivationLifecycleEvent>;

  /**
   * Optional suffix appended to each recorded event.
   *
   * @remarks
   * String suffixes are reused for every event. Function suffixes are evaluated
   * each time a lifecycle callback records an event, which is useful for tests
   * that need to assert interleaved call order across several services.
   */
  suffix?: string | (() => string);

  /**
   * Mutable event log used by the generated service.
   *
   * @remarks
   * Pass the same array to several generated services to assert their combined
   * lifecycle order.
   */
  events?: Array<string>;
}

/**
 * Creates an injectable service class that records lifecycle events.
 *
 * @remarks
 * Each call returns a fresh injectable class with static `METHODS`, `EVENTS`,
 * and `SUFFIX` members. By default the class owns a new event log; pass
 * {@link CreateLifecycleServiceOptions.events} when multiple generated classes
 * should write to one shared log.
 *
 * Provision and deprovision hooks come from React provider lifecycle
 * decorators. Activation and deactivation hooks come from core service
 * lifecycle decorators.
 *
 * @internal
 *
 * @param options - Event log, enabled callbacks, and optional event suffix.
 * @returns Injectable service class configured for lifecycle-order assertions.
 */
export function createLifecycleService(options: CreateLifecycleServiceOptions = {}) {
  const { methods, suffix, events } = options;

  @Injectable()
  class LifecycleService {
    public static readonly SUFFIX = () => {
      const value = typeof suffix === "function" ? suffix() : suffix;

      return value ? "-" + value : "";
    };

    public static readonly METHODS: Array<ActivationLifecycleEvent> = methods ?? [
      "activated",
      "deactivation",
      "provision",
      "deprovision",
    ];
    public static readonly EVENTS: Array<string> = events ?? [];

    @OnActivated()
    public onActivated(): void {
      if (LifecycleService.METHODS.includes("activated")) {
        LifecycleService.EVENTS.push("activated" + LifecycleService.SUFFIX());
      }
    }

    @OnDeactivation()
    public onDeactivation(): void {
      if (LifecycleService.METHODS.includes("deactivation")) {
        LifecycleService.EVENTS.push("deactivation" + LifecycleService.SUFFIX());
      }
    }

    @OnProvision()
    public onProvision(): void {
      if (LifecycleService.METHODS.includes("provision")) {
        LifecycleService.EVENTS.push("provision" + LifecycleService.SUFFIX());
      }
    }

    @OnDeprovision()
    public onDeprovision(): void {
      if (LifecycleService.METHODS.includes("deprovision")) {
        LifecycleService.EVENTS.push("deprovision" + LifecycleService.SUFFIX());
      }
    }
  }

  return { LifecycleService, events: LifecycleService.EVENTS, methods, suffix: LifecycleService.SUFFIX };
}
