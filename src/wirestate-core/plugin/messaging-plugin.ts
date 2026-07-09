import { type ServiceToken } from "../binding/binding";
import { type Container } from "../container/container";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { type Optional, type Newable } from "../types/general";

import { getMessagingRegistrations, type MessagingRegistration } from "./messaging-registration";
import { type WirestatePlugin } from "./plugin";

/**
 * Messaging kinds declared by each built-in messaging plugin.
 *
 * @internal
 */
const MESSAGING_PLUGIN_HANDLED_KINDS: WeakMap<MessagingPlugin, ReadonlyArray<symbol>> = new WeakMap();

/**
 * Empty handled-kind list returned for non-messaging plugins.
 *
 * @internal
 */
const NO_MESSAGING_PLUGIN_HANDLED_KINDS: ReadonlyArray<symbol> = [];

/**
 * Built-in base for the messaging plugins (`EventsPlugin` / `CommandsPlugin` /
 * `QueriesPlugin`).
 *
 * @remarks
 * Each concrete plugin supplies the {@link MessagingRegistration} for its kind
 * (`{ kind, token, register }`, declared beside the decorator). The base then:
 *
 * @internal
 */
export abstract class MessagingPlugin implements WirestatePlugin {
  protected constructor(private readonly registration: MessagingRegistration) {
    MESSAGING_PLUGIN_HANDLED_KINDS.set(this, [registration.kind]);
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

/**
 * Returns the messaging kinds a built-in messaging plugin owns.
 *
 * @remarks
 * Custom {@link WirestatePlugin} implementations cannot claim messaging kinds
 * until Wirestate exposes the complete custom messaging-plugin contract.
 *
 * @internal
 *
 * @param plugin - Plugin to inspect.
 * @returns The plugin's built-in messaging kinds, or an empty list.
 */
export function getMessagingPluginHandledKinds(plugin: WirestatePlugin): ReadonlyArray<symbol> {
  return plugin instanceof MessagingPlugin
    ? (MESSAGING_PLUGIN_HANDLED_KINDS.get(plugin) ?? NO_MESSAGING_PLUGIN_HANDLED_KINDS)
    : NO_MESSAGING_PLUGIN_HANDLED_KINDS;
}
