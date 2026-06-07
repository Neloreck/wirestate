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
 * `forwardRef` delays token lookup when two constructor dependencies refer to
 * each other. Prefer breaking the cycle when possible, for example by moving
 * shared state or coordination into another service.
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
