import { LazyServiceIdentifier, type ServiceIdentifier } from "inversify";

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
  type ServiceIdentifier,
  bindingTypeValues as BindingType,
  bindingScopeValues as ScopeBindingType,
  LazyServiceIdentifier,
} from "inversify";

export function forwardRef<TInstance = unknown>(
  forward: () => ServiceIdentifier<TInstance>
): LazyServiceIdentifier<TInstance> {
  return new LazyServiceIdentifier(forward);
}
