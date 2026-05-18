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
   * containers created from options are disposed on unmount. Managed containers
   * are intentionally recreated only when `parent` or `entries` changes by
   * shallow comparison; inline `seed`, `seeds`, and `activate` values are not
   * treated as recreation signals. Pass a React `key` to force a fresh managed
   * container when those options should be re-applied.
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
 *   creates a container, owns its disposal, recreates it when `parent` or
 *   `entries` change, and revives it after React development remount cleanup.
 *   Other creation options are intentionally ignored for reuse decisions to
 *   avoid remounting on common inline object/array props; use a React `key`
 *   when a seed or activation change should create a new container.
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
 * In the case of managed container, only changes of entries and parent container
 * cause re-creation. This keeps inline seed/activation props from causing
 * accidental container churn; callers can force recreation with a React `key`.
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
    !(current.source instanceof Container) &&
    current.source.parent === source.parent &&
    shallowEqualArrays(current.source.entries ?? [], source.entries ?? [])
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
