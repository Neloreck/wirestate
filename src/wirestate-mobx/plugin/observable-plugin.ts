import { type WirestatePlugin } from "@wirestate/core";
import { makeObservable } from "mobx";

import { hasStoredAnnotations } from "./stored-annotations";

/**
 * Applies MobX decorator annotations to every service the container activates.
 *
 * @remarks
 * Optional shortcut for legacy experimental decorators only. Legacy MobX decorators such as
 * `@Observable()` record annotations on the prototype and apply nothing, so the regular way to apply
 * them is `makeObservable(this)` in the service constructor. Register this plugin once on a container
 * and the call happens at activation instead: after construction and field initializers, before the
 * service's own `@OnActivation`, and for every container in the subtree.
 *
 * Under TC39 standard decorators the plugin is a no-op and can be left out of the container. MobX
 * applies `@Observable() accessor`, `@Computed()` and `@Action()` itself while the instance
 * initializes and records no annotations to defer, so no `makeObservable` call is needed and the
 * plugin finds nothing to apply. Registering it anyway is harmless.
 *
 * A service that still calls `makeObservable(this)` itself keeps working. A service without
 * annotations is left alone.
 *
 * @group Plugins
 *
 * @example
 * ```typescript
 * import { Container, Injectable } from "@wirestate/core";
 * import { Action, Observable, ObservablePlugin } from "@wirestate/mobx";
 *
 * @Injectable()
 * class CounterService {
 *   @Observable()
 *   public count: number = 0;
 *
 *   @Action()
 *   public increment(): void {
 *     this.count += 1;
 *   }
 * }
 *
 * const container = new Container({ bindings: [CounterService], plugins: [new ObservablePlugin()] });
 * ```
 */
export class ObservablePlugin implements WirestatePlugin {
  public onActivate(instance: object): void {
    if (hasStoredAnnotations(instance)) {
      makeObservable(instance);
    }
  }
}
