import { Injectable } from "../../wirestate-core/alias";
import { OnActivated } from "../../wirestate-core/service/on-activated";
import { OnDeactivation } from "../../wirestate-core/service/on-deactivation";
import { OnDeprovision } from "../../wirestate-react/services/on-deprovision";
import { OnProvision } from "../../wirestate-react/services/on-provision";

/**
 * Lifecycle event names emitted by {@link createLifecycleService}.
 */
export type ActivationLifecycleEvent = "activated" | "deactivation" | "provision" | "deprovision";

/**
 * Creates a service class that records selected lifecycle events.
 *
 * @internal
 *
 * @param methods - Lifecycle events that should be recorded.
 * @param suffix
 * @returns The service class and shared event log.
 */
export function createLifecycleService(
  methods: ReadonlyArray<ActivationLifecycleEvent> = ["activated", "deactivation", "provision", "deprovision"],
  suffix: string = ""
) {
  const lifecycleEvents: Array<string> = [];

  @Injectable()
  class LifecycleService {
    @OnActivated()
    public onActivated(): void {
      if (methods.includes("activated")) {
        lifecycleEvents.push("activated" + suffix);
      }
    }

    @OnDeactivation()
    public onDeactivation(): void {
      if (methods.includes("deactivation")) {
        lifecycleEvents.push("deactivation" + suffix);
      }
    }

    @OnProvision()
    public onProvision(): void {
      if (methods.includes("provision")) {
        lifecycleEvents.push("provision" + suffix);
      }
    }

    @OnDeprovision()
    public onDeprovision(): void {
      if (methods.includes("deprovision")) {
        lifecycleEvents.push("deprovision" + suffix);
      }
    }
  }

  return { LifecycleService, lifecycleEvents };
}
