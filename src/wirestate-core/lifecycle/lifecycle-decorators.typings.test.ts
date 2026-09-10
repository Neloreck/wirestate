// noinspection JSUnusedLocalSymbols

import { OnActivation, getActivationHandlerMetadata } from "../activation/on-activation";
import { OnDeactivation } from "../activation/on-deactivation";
import { type ProvisionId } from "../activation/wire-status";
import { OnDeprovision } from "../provision/on-deprovision";
import { OnProvision, getProvisionHandlerMetadata } from "../provision/on-provision";

describe("lifecycle decorator typings", () => {
  it("accepts hooks with the arguments the phase delivers", () => {
    class Service {
      @OnActivation()
      public onActivation(): void {}

      @OnDeactivation()
      public async onDeactivation(): Promise<void> {}

      @OnProvision()
      public onProvision(provisionId: ProvisionId): void {
        void provisionId;
      }

      @OnDeprovision()
      public async onDeprovision(): Promise<void> {}
    }

    expect(getActivationHandlerMetadata(new Service())).toBe("onActivation");
    expect(getProvisionHandlerMetadata(new Service())).toBe("onProvision");
  });

  it("rejects hooks declaring arguments the phase never delivers", () => {
    // Activation and deactivation carry no arguments. A hook declaring one would read `undefined`
    // at runtime, so the decorator refuses the method at compile time.
    class ActivationWithArgument {
      // @ts-expect-error - @OnActivation delivers no arguments.
      @OnActivation()
      public onActivation(provisionId: ProvisionId): void {
        void provisionId;
      }
    }

    class DeactivationWithArgument {
      // @ts-expect-error - @OnDeactivation delivers no arguments.
      @OnDeactivation()
      public onDeactivation(provisionId: ProvisionId): void {
        void provisionId;
      }
    }

    class ProvisionWithWrongArgument {
      // @ts-expect-error - @OnProvision delivers a numeric provision id.
      @OnProvision()
      public onProvision(name: string): void {
        void name;
      }
    }

    expect([ActivationWithArgument, DeactivationWithArgument, ProvisionWithWrongArgument]).toHaveLength(3);
  });
});
