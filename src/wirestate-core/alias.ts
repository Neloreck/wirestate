import { LazyServiceIdentifier, type ServiceIdentifier } from "inversify";

/**
 * @group inversify
 * @see {@link https://inversify.io/}
 */
export {
  Container,
  ContainerModule,
  inject as Inject,
  injectable as Injectable,
  multiInject as MultiInject,
  named as Named,
  optional as Optional,
  tagged as Tagged,
  postConstruct as PostConstruct,
  preDestroy as PreDestroy,
  Newable,
  type ServiceIdentifier,
  bindingTypeValues as BindingType,
  bindingScopeValues as ScopeBindingType,
  LazyServiceIdentifier,
} from "inversify";

/**
 * Util to resolve circular dependencies by wrapping the service identifier in a lazy identifier.
 *
 * @group inversify
 * @see {@link https://inversify.io/}
 *
 * @param forward - a function that returns the service identifier
 * @returns a lazy service identifier
 */
export function forwardRef<TInstance = unknown>(
  forward: () => ServiceIdentifier<TInstance>
): LazyServiceIdentifier<TInstance> {
  return new LazyServiceIdentifier(forward);
}
