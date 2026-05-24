import {
  Container,
  ContainerActivation,
  createContainer,
  InjectableEntries,
  provisionContainer,
  SeedEntries,
} from "@wirestate/core";
import { createElement, type ReactNode, useEffect, useRef, useState } from "react";

import { ContainerReactContext } from "../context/container-context";
import { useContainer } from "../context/use-container";
import { AnyObject, Maybe, Optional } from "../types/general";
import { shallowEqualActivation, shallowEqualArrays, shallowEqualObjects } from "../utils/shallow-equal";

import { ProvisionLifecycle, retainContainer, scheduleContainerDestruction } from "./provision-lifecycle";

/**
 * Child-container inputs controlled by {@link SubContainerProvider}.
 *
 * @internal
 */
interface SubContainerSource {
  readonly parent: Container;
  readonly seeds?: SeedEntries;
  readonly activate: ContainerActivation;
  readonly entries: InjectableEntries;
}

/**
 * Active child-container state stored in component state.
 */
interface SubContainerState {
  readonly container: Container;
  readonly source: SubContainerSource;
}

/**
 * Props accepted by {@link SubContainerProvider}.
 *
 * @group Provision
 */
export interface SubContainerProviderProps {
  /**
   * Targeted seeds applied before entries are bound.
   *
   * @remarks
   * Seed changes recreate the child container when the seed entries change by
   * shallow comparison.
   */
  readonly seeds?: SeedEntries;

  /**
   * Services or descriptors bound inside the child container.
   *
   * @remarks
   * The child container is recreated when provider inputs change by shallow
   * comparison.
   */
  readonly entries: InjectableEntries;

  /**
   * Services to resolve immediately.
   *
   * @remarks
   * Pass an array to activate specific services. Listed services must also be
   * present in the `entries` array. Pass `true` to activate all provided entries.
   */
  readonly activate?: ContainerActivation;

  /**
   * React subtree that receives the child container.
   */
  readonly children?: ReactNode;
}

/**
 * Provides a child container derived from the nearest parent container.
 *
 * @remarks
 * The provider owns the child container. It recreates when the normalized
 * source inputs change by shallow comparison.
 *
 * @group Provision
 *
 * @param props - Provider props.
 * @returns A React context provider for the child container.
 */
export function SubContainerProvider(props: SubContainerProviderProps) {
  const lifecycleRef = useRef<Optional<ProvisionLifecycle>>(null);

  const parent: Container = useContainer();

  const source: SubContainerSource = {
    parent: parent,
    activate: props.activate ?? true,
    entries: props.entries,
    seeds: props.seeds,
  };

  const [state, setState] = useState<SubContainerState>(() => ({
    container: createContainer(source),
    source,
  }));

  const needsReplacement: boolean =
    state.source.parent !== source.parent ||
    !shallowEqualObjects(state.source.seeds as Maybe<AnyObject>, source.seeds as Maybe<AnyObject>) ||
    !shallowEqualArrays(state.source.entries, source.entries) ||
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
    provisionContainer(activeState.container, lifecycle.provisionedServices, activeState.source.entries);

    return () => scheduleContainerDestruction(activeState.container, lifecycle);
  }, [activeState]);

  return createElement(ContainerReactContext.Provider, { value: activeState.container }, props.children ?? null);
}
