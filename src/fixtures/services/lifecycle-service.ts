import { Injectable } from "../../wirestate-core/alias";
import { OnActivated } from "../../wirestate-core/service/on-activated";
import { OnDeactivation } from "../../wirestate-core/service/on-deactivation";
import { OnDeprovision } from "../../wirestate-react/services/on-deprovision";
import { OnProvision } from "../../wirestate-react/services/on-provision";

/**
 * Lifecycle event names emitted by {@link createLifecycleService}.
 */
export type ActivationLifecycleEvent = "activated" | "deactivation" | "provision" | "deprovision";

export interface CreateLifecycleServiceOptions {
  methods?: Array<ActivationLifecycleEvent>;
  suffix?: string;
  events?: Array<string>;
}

/**
 * Creates a service class that records selected lifecycle events.
 *
 * @param options - Todo;.
 * @internal
 *
 * @returns The service class and shared event log.
 */
export function createLifecycleService(options: CreateLifecycleServiceOptions = {}) {
  const { methods, suffix, events } = options;

  @Injectable()
  class LifecycleService {
    public static readonly SUFFIX: string = suffix ? "-" + suffix : "";
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
        LifecycleService.EVENTS.push("activated" + LifecycleService.SUFFIX);
      }
    }

    @OnDeactivation()
    public onDeactivation(): void {
      if (LifecycleService.METHODS.includes("deactivation")) {
        LifecycleService.EVENTS.push("deactivation" + LifecycleService.SUFFIX);
      }
    }

    @OnProvision()
    public onProvision(): void {
      if (LifecycleService.METHODS.includes("provision")) {
        LifecycleService.EVENTS.push("provision" + LifecycleService.SUFFIX);
      }
    }

    @OnDeprovision()
    public onDeprovision(): void {
      if (LifecycleService.METHODS.includes("deprovision")) {
        LifecycleService.EVENTS.push("deprovision" + LifecycleService.SUFFIX);
      }
    }
  }

  return LifecycleService;
}
