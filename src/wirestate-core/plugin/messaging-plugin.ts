import { type ServiceToken } from "../binding/binding";
import { type Container } from "../container/container";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { type Optional, type Newable } from "../types/general";

import { getMessagingRegistrations, type MessagingRegistration } from "./messaging-registration";
import { type WirestatePlugin } from "./plugin";

/**
 * Built-in base for the messaging plugins (`EventsPlugin` / `CommandsPlugin` /
 * `QueriesPlugin`).
 *
 * @remarks
 * Each concrete plugin supplies the {@link MessagingRegistration} for its kind
 * (`{ kind, token, register }`, declared beside the decorator). The base then:
 *
 * - **owns its bus binding**: `install` binds the bus token, so `inject(EventBus)`
 *   and chain-resolved sending work without a separate `bindings` entry;
 * - **declares its kind** via `handles`, so provision can match handler metadata to
 *   a plugin and throw on an unhandled kind;
 * - **force-activates participants**: `participates` is true for any class
 *   declaring this kind, so a dormant handler service is resolved at provision;
 * - **wires handlers** at provision: `onProvision` resolves the bus up the chain
 *   and subscribes the instance's handlers of this kind, registering each
 *   unsubscribe as a disposer.
 *
 * @internal
 */
export abstract class MessagingPlugin implements WirestatePlugin {
  protected constructor(private readonly registration: MessagingRegistration) {}

  public get handles(): ReadonlyArray<symbol> {
    return [this.registration.kind];
  }

  public install(container: Container): void {
    const token: ServiceToken = this.registration.token;

    if (typeof token === "function" && !container.hasOwn(token)) {
      container.bind(token as Newable<object>);
    }
  }

  public participates(token: ServiceToken): boolean {
    return (
      typeof token === "function" &&
      Boolean(token.prototype) &&
      getMessagingRegistrations(token.prototype as object).some(
        (registration) => registration.kind === this.registration.kind
      )
    );
  }

  public onProvision(instance: object, container: Container, addDisposer: (dispose: () => void) => void): void {
    if (!getMessagingRegistrations(instance).some((registration) => registration.kind === this.registration.kind)) {
      return;
    }

    const bus: Optional<Newable<object> | object> = container.get(this.registration.token, {
      optional: true,
    }) as Optional<object>;

    if (bus) {
      this.registration.register(bus, instance, container).forEach((it) => addDisposer(it));
    } else {
      const busName: string =
        typeof this.registration.token === "function" ? this.registration.token.name : String(this.registration.token);

      throw new WirestateError(
        `Service '${instance.constructor.name}' declares a messaging handler but no '${busName}' is bound on its ` +
          `container or any ancestor.`,
        ERROR_CODE_VALIDATION_ERROR
      );
    }
  }
}
