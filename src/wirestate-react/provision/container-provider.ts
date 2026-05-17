import { Container, createContainer, CreateContainerOptions } from "@wirestate/core";
import { createElement, ReactNode } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerReactContext } from "../context/container-context";
import { shallowEqualArrays } from "../utils/shallow-equal-arrays";

import { ContainerProvisionState, useContainerProvisionState } from "./use-container-provision-state";

/**
 * Describes how {@link ContainerProvider} receives its root container.
 *
 * @remarks
 * Pass an existing {@link Container} when ownership lives outside React. Pass
 * {@link CreateContainerOptions} when the provider should create and dispose a
 * managed container for the subtree.
 */
type ContainerProviderSource = Container | CreateContainerOptions;

/**
 * Runtime snapshot currently exposed through {@link ContainerReactContext}.
 *
 * @internal
 */
type ContainerProviderState = ContainerProvisionState<ContainerProviderSource>;

/**
 * Represents props accepted by {@link ContainerProvider}.
 *
 * @group Provision
 */
export interface ContainerProviderProps {
  /**
   * Container instance or options used to create one.
   *
   * @remarks
   * External container instances are never disposed by this provider. Managed
   * containers created from options are disposed on unmount and recreated when
   * the `entries` array changes by shallow comparison.
   */
  readonly container: ContainerProviderSource;

  /**
   * React subtree that receives the active container.
   */
  readonly children?: ReactNode;
}

/**
 * Provides a root Wirestate container to a React subtree.
 *
 * @remarks
 * The provider supports two modes:
 *
 * - External mode: `container` is a prebuilt {@link Container}. The provider
 *   only passes it through context.
 * - Managed mode: `container` is {@link CreateContainerOptions}. The provider
 *   creates a container, owns its disposal, recreates it when `entries` change,
 *   and revives it after React development remount cleanup.
 *
 * @group Provision
 *
 * @param props - Provider props.
 * @returns A React context provider for the active container.
 */
export function ContainerProvider(props: ContainerProviderProps) {
  const state: ContainerProviderState = useContainerProvisionState(props.container, {
    create: createContainerState,
    label: "ContainerProvider",
    reuse: canReuseContainerState,
  });

  return createElement(ContainerReactContext.Provider, { value: state.container }, props.children ?? null);
}

/**
 * Selects the provider state that should be exposed for the current source.
 *
 * @param current - Previously exposed state, if any.
 * @param source - Current container source prop.
 * @param disposed - Containers already disposed by this provider.
 * @returns `true` when current state can be reused.
 */
function canReuseContainerState(
  current: ContainerProviderState,
  source: ContainerProviderSource,
  disposed: WeakSet<Container>
): boolean {
  if (source instanceof Container) {
    return !current.owned && current.container === source;
  }

  return (
    current.owned &&
    !disposed.has(current.container) &&
    shallowEqualArrays(source.entries ?? [], current.source instanceof Container ? [] : (current.source.entries ?? []))
  );
}

/**
 * Creates provider state for an external or managed container source.
 *
 * @param source - Container instance or creation options.
 * @returns Provider state ready for context.
 */
function createContainerState(source: ContainerProviderSource): ContainerProviderState {
  if (source instanceof Container) {
    dbg.info(prefix(__filename), "Constructing for external container:", {
      container: source,
    });

    return {
      source,
      container: source,
      owned: false,
    };
  } else {
    dbg.info(prefix(__filename), "Constructing for managed container:", {
      source,
    });

    const container: Container = createContainer(source);

    return {
      source,
      container,
      owned: true,
    };
  }
}
