import {
  Container,
  ContainerActivation,
  createContainer,
  BindingEntries,
  provisionContainer,
  SeedBindings,
} from "@wirestate/core";
import { createElement, type ReactNode, useEffect, useRef, useState } from "react";

import { ContainerReactContext } from "../context/container-context";
import { useContainer } from "../context/use-container";
import { AnyObject, Maybe, Optional } from "../types/general";
import { shallowEqualActivation, shallowEqualArrays, shallowEqualObjects } from "../utils/shallow-equal";

import { ProvisionLifecycle, retainContainer, scheduleContainerDestruction } from "./provision-lifecycle";

/**
 * Represents child-container inputs controlled by {@link SubContainerProvider}.
 *
 * @internal
 */
interface SubContainerSource {
  readonly parent: Container;
  readonly seeds?: SeedBindings;
  readonly activate: ContainerActivation;
  readonly bindings: BindingEntries;
}

/**
 * Represents active child-container state stored in the component state.
 *
 * @internal
 */
interface SubContainerState {
  readonly container: Container;
  readonly source: SubContainerSource;
}

/**
 * Represents props for {@link SubContainerProvider}.
 *
 * @group Provision
 */
export interface SubContainerProviderProps {
  /**
   * Targeted seeds applied before bindings are bound.
   *
   * @remarks
   * Seed changes recreate the child container when the seed bindings change by
   * shallow comparison.
   */
  readonly seeds?: SeedBindings;

  /**
   * Services or descriptors bound inside the child container.
   *
   * @remarks
   * The child container is recreated when provider inputs change by shallow
   * comparison.
   */
  readonly bindings: BindingEntries;

  /**
   * Services to resolve immediately.
   *
   * @remarks
   * Pass an array to activate specific services. Listed services must also be
   * present in the `bindings` array. Pass `true` to activate all provided bindings.
   */
  readonly activate?: ContainerActivation;

  /**
   * React subtree that receives the child container.
   */
  readonly children?: ReactNode;
}

/**
 * Provides a managed child container under the nearest parent container.
 *
 * @remarks
 * Use it for subtree-local services: a checkout flow, modal, wizard step, or
 * tenant branch. The child inherits parent bindings but owns its buses, seeds,
 * lifecycle, and disposal.
 *
 * @group Provision
 *
 * @param props - Provider props.
 * @returns A React context provider for the child container.
 *
 * @example
 * ```tsx
 * import { Injectable } from "@wirestate/core";
 * import { SubContainerProvider } from "@wirestate/react";
 *
 * @Injectable()
 * class CheckoutService {}
 *
 * export function CheckoutScope() {
 *   return (
 *     <SubContainerProvider bindings={[CheckoutService]}>
 *       <Checkout />
 *     </SubContainerProvider>
 *   );
 * }
 * ```
 */
export function SubContainerProvider(props: SubContainerProviderProps) {
  const lifecycleRef = useRef<Optional<ProvisionLifecycle>>(null);

  const parent: Container = useContainer();

  const source: SubContainerSource = {
    parent: parent,
    activate: props.activate ?? true,
    bindings: props.bindings,
    seeds: props.seeds,
  };

  const [state, setState] = useState<SubContainerState>(() => ({
    container: createContainer(source),
    source,
  }));

  const needsReplacement: boolean =
    state.source.parent !== source.parent ||
    !shallowEqualObjects(state.source.seeds as Maybe<AnyObject>, source.seeds as Maybe<AnyObject>) ||
    !shallowEqualArrays(state.source.bindings, source.bindings) ||
    !shallowEqualActivation(state.source.activate, source.activate);

  let activeState: SubContainerState = state;

  if (needsReplacement) {
    activeState = {
      container: createContainer(source),
      source,
    };

    setState(activeState);
  }

  useEffect(() => {
    const lifecycle: ProvisionLifecycle = (lifecycleRef.current ||= {
      pendingDestruction: new Map(),
      provisionedServices: new Map(),
    });

    retainContainer(activeState.container, lifecycle);
    provisionContainer(activeState.container, lifecycle.provisionedServices, activeState.source.bindings);

    return () => scheduleContainerDestruction(activeState.container, lifecycle);
  }, [activeState]);

  return createElement(ContainerReactContext.Provider, { value: activeState.container }, props.children ?? null);
}
