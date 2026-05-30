import { LazyServiceIdentifier, type ServiceIdentifier } from "inversify";

/**
 * @group External-inversify
 * @see {@link https://inversify.io/}
 */
export { Container, LazyServiceIdentifier, Newable, ServiceIdentifier } from "inversify";

/**
 * @group External-inversify
 * @see {@link https://inversify.io/}
 */
export {
  inject as Inject,
  injectable as Injectable,
  multiInject as MultiInject,
  named as Named,
  optional as Optional,
  tagged as Tagged,
} from "inversify";

/**
 * @group External-inversify-binding
 * @see {@link https://inversify.io/}
 */
export { bindingTypeValues as BindingType, bindingScopeValues as BindingScope } from "inversify";

/**
 * Wraps a token for circular constructor dependencies.
 *
 * `forwardRef` delays token lookup. It is a small escape hatch, not a design
 * goal. If two services need each other like two drawers that cannot open
 * together, prefer moving the shared piece into a third service.
 *
 * @group External-inversify
 * @see {@link https://inversify.io/}
 *
 * @param forward - Function that returns the token.
 * @returns Lazy service identifier.
 */
export function forwardRef<TInstance = unknown>(
  forward: () => ServiceIdentifier<TInstance>
): LazyServiceIdentifier<TInstance> {
  return new LazyServiceIdentifier(forward);
}
