import type { ServiceToken } from "../binding/binding";
import type { Container } from "../container/container";

/**
 * A container lifecycle plugin.
 *
 * @remarks
 * Plugins are registered on a {@link Container} via `config.plugins` and observe
 * or extend the container lifecycle. Every hook is optional: a plugin implements
 * only the phases it cares about. A plugin is a class instance (`new MyPlugin()`),
 * which gives it a home for per-instance state.
 *
 * Plugins are the framework layer that brackets the user layer
 * (`@OnActivated` / `@OnProvision`): on setup phases plugin hooks run before
 * the matching user hook. On teardown phases they run *after* it.
 *
 * Setup hooks (`install`, `onActivate`, `onContainerProvision`, `onProvision`) are
 * atomic: a throw unwinds the activation/provision cycle. Teardown hooks
 * (`onDeactivate`, `onDeprovision`, `onContainerDeprovision`) and disposers are
 * failsafe: a throw is swallowed and never aborts teardown.
 *
 * A plugin's effective reach is its container plus every descendant container
 * (plugins resolve up the parent chain), so a plugin registered on the root
 * observes the whole subtree.
 *
 * @group Plugin
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
   * same kind.
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
