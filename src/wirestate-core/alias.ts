import { LazyServiceIdentifier as LazyIdentifier, ServiceIdentifier as Identifier } from "inversify";

/**
 * @group External-inversify
 * @see {@link https://inversify.io/}
 */
export {
  Container,
  LazyServiceIdentifier as LazyIdentifier,
  Newable,
  ServiceIdentifier as Identifier,
} from "inversify";

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
 * goal. If two instances need each other like two drawers that cannot open
 * together, prefer moving the shared piece into a one.
 *
 * @group External-inversify
 * @see {@link https://inversify.io/}
 *
 * @param forward - Function that returns the token.
 * @returns Lazy identifier.
 */
export function forwardRef<TInstance = unknown>(forward: () => Identifier<TInstance>): LazyIdentifier<TInstance> {
  return new LazyIdentifier(forward);
}
