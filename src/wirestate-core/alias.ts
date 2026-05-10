import { LazyServiceIdentifier, type ServiceIdentifier } from "inversify";

/**
 * @group inversify
 * @see {@link https://inversify.io/}
 */
export {
  AbstractNewable,
  Bind,
  BindInFluentSyntax,
  BindInWhenOnFluentSyntax,
  BindOnFluentSyntax,
  BindToFluentSyntax,
  BindWhenFluentSyntax,
  BindWhenOnFluentSyntax,
  BindingActivation,
  BindingConstraints,
  BindingDeactivation,
  BindingIdentifier,
  BindingScope,
  BoundServiceSyntax,
  Container,
  ContainerModule,
  ContainerModuleLoadOptions,
  ContainerOptions,
  DynamicValueBuilder,
  Factory,
  GetAllOptions,
  GetOptions,
  GetOptionsTagConstraint,
  InjectFromBaseOptions,
  InjectFromBaseOptionsLifecycle,
  InjectFromHierarchyOptions,
  InjectFromHierarchyOptionsLifecycle,
  IsBound,
  IsBoundOptions,
  LazyServiceIdentifier,
  MapToResolvedValueInjectOptions,
  MetadataName,
  MetadataTag,
  MultiInjectOptions,
  Newable,
  OptionalGetOptions,
  Rebind,
  RebindSync,
  ResolutionContext,
  ResolvedValueInjectOptions,
  ResolvedValueMetadataInjectOptions,
  ResolvedValueMetadataInjectTagOptions,
  ServiceIdentifier,
  Unbind,
  UnbindSync,
  bindingScopeValues,
  bindingTypeValues,
} from "inversify";

/**
 * @group inversify
 * @see {@link https://inversify.io/}
 */
export {
  inject as Inject,
  injectFromBase as InjectFromBase,
  injectFromHierarchy as InjectFromHierarchy,
  injectable as Injectable,
  multiInject as MultiInject,
  named as Named,
  optional as Optional,
  postConstruct as PostConstruct,
  preDestroy as PreDestroy,
  tagged as Tagged,
  unmanaged as Unmanaged,
} from "inversify";

/**
 * @group inversify-binding
 * @see {@link https://inversify.io/}
 */
export { bindingTypeValues as BindingType, bindingScopeValues as ScopeBindingType } from "inversify";

/**
 * Util to resolve circular dependencies by wrapping the service identifier in a lazy identifier.
 *
 * @group inversify
 * @see {@link https://inversify.io/}
 *
 * @param forward - A function that returns the service identifier.
 * @returns A lazy service identifier.
 */
export function forwardRef<TInstance = unknown>(
  forward: () => ServiceIdentifier<TInstance>
): LazyServiceIdentifier<TInstance> {
  return new LazyServiceIdentifier(forward);
}
