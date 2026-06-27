import type { ServiceToken } from "../binding/binding";
import type { Container } from "../container/container";

/**
 * A container lifecycle plugin.
 *
 * @remarks
 * Register plugins on a {@link Container} via `config.plugins`. A plugin is a
 * class instance, so it can hold per-instance state, and every hook is optional.
 *
 * Plugins bracket the user layer (`@OnActivated` / `@OnProvision`): setup hooks
 * run before the matching user hook, teardown hooks run after it. Setup hooks
 * (`install`, `onActivate`, `onContainerProvision`, `onProvision`) are atomic, so
 * a throw unwinds the activation/provision cycle. Teardown hooks (`onDeactivate`,
 * `onDeprovision`, `onContainerDeprovision`) and disposers are failsafe, so a
 * throw is swallowed and teardown continues. Plugin teardown failures are not
 * reported through the container error handler.
 *
 * A plugin reaches its container and every descendant (plugins resolve up the
 * parent chain, nearest first), so one registered on the root observes the whole
 * subtree unless a nearer plugin shadows a handled kind.
 *
 * @group Plugins
 *
 * @example
 * ```typescript
 * import { Container, WirestatePlugin } from "@wirestate/core";
 *
 * class DevToolsPlugin implements WirestatePlugin {
 *   public onActivate(instance: object): void {
 *     console.log("activated", instance.constructor.name);
 *   }
 * }
 *
 * new Container({ plugins: [new DevToolsPlugin()] });
 * ```
 */
export interface WirestatePlugin {
  /**
   * Contributes bindings (or other one-time setup) when the plugin is registered.
   *
   * @remarks
   * Runs once, on the container the plugin is registered on (not on inheriting children),
   * before any binding activates.
   *
   * @param container - Container the plugin is registered on.
   */
  install?(container: Container): void;

  /**
   * Declares whether a binding token is a participant this plugin wires.
   *
   * @remarks
   * Token/class-level so it can drive force-activation: a token this returns
   * `true` for is resolved (activated) at provision even if nothing injected it,
   * and the instance is then delivered to {@link WirestatePlugin.onProvision}.
   * Omit for a pure observer that force-activates nothing.
   *
   * @param token - Binding token to inspect.
   * @returns Whether the plugin participates in this token.
   */
  participates?(token: ServiceToken): boolean;

  /**
   * Messaging-handler kinds this plugin owns (advanced).
   *
   * @remarks
   * Used by the built-in messaging plugins. Provision matches declared handler
   * metadata against the union of registered plugins' kinds and throws on a kind
   * no plugin handles. A nearer plugin owning a kind shadows an ancestor's of the
   * same kind. Observer plugins usually omit this field.
   */
  readonly handles?: ReadonlyArray<symbol>;

  /**
   * Runs once at the start of a container provision cycle, before instance wiring.
   *
   * @param container - Container being provisioned.
   */
  onContainerProvision?(container: Container): void;

  /**
   * Runs once at the end of a container deprovision cycle, after all teardown.
   *
   * @param container - Container being deprovisioned.
   */
  onContainerDeprovision?(container: Container): void;

  /**
   * Runs after a service instance is activated, before its `@OnActivated`.
   *
   * @param instance - The activated instance.
   * @param container - Container that activated it.
   */
  onActivate?(instance: object, container: Container): void;

  /**
   * Runs as a service instance is deactivated, after its `@OnDeactivation`.
   *
   * @param instance - The instance being deactivated.
   * @param container - Container that owns it.
   */
  onDeactivate?(instance: object, container: Container): void;

  /**
   * Wires a provisioned instance, before any user `@OnProvision`.
   *
   * @remarks
   * Register teardown with `addDisposer`. Disposers run (reverse order, failsafe)
   * at deprovision. A throw here unwinds the whole provision cycle.
   *
   * @param instance - The provisioned instance.
   * @param container - Container being provisioned.
   * @param addDisposer - Registers a teardown callback for this provision cycle.
   */
  onProvision?(instance: object, container: Container, addDisposer: (dispose: () => void) => void): void;

  /**
   * Runs as a provisioned instance is deprovisioned, after its `@OnDeprovision`.
   *
   * @param instance - The instance being deprovisioned.
   * @param container - Container that owns it.
   */
  onDeprovision?(instance: object, container: Container): void;
}
