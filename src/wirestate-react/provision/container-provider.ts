import { Container, createContainer, CreateContainerOptions, WirestateError } from "@wirestate/core";
import { createElement, ReactNode, useEffect, useRef, useState } from "react";

import { ContainerReactContext } from "../context/container-context";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import {
  provisionContainer,
  ProvisionLifecycle,
  retainContainer,
  scheduleContainerDestruction,
} from "../services/provision-lifecycle";
import { Optional } from "../types/general";
import { shallowEqualArrays } from "../utils/shallow-equal-arrays";

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
   * containers created from options are disposed on unmount and activate all
   * entries by default unless `activate` is provided explicitly. Managed
   * containers are intentionally recreated only when `parent` or `entries`
   * changes by shallow comparison; inline `seed` and `seeds` values are not
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
 * Active provider state stored in the component state.
 */
interface ContainerProviderState {
  readonly container: Container;
  readonly source: CreateContainerOptions;
}

/**
 * Provides a root Wirestate container to a React subtree.
 *
 * @remarks
 * Two modes are supported:
 *
 * - External: `container` is a prebuilt {@link Container}. The provider only
 *   passes it through context and never disposes it.
 * - Managed: `container` is {@link CreateContainerOptions}. The provider
 *   creates a container, activates entries by default, owns its disposal, and
 *   recreates it when `parent` or `entries` change.
 *
 * @group Provision
 *
 * @param props - Provider props.
 * @returns A React context provider for the active container.
 */
export function ContainerProvider(props: ContainerProviderProps) {
  const source: ContainerProviderSource = props.container;
  const owned: boolean = !(source instanceof Container);
  const ownedRef = useRef<boolean>(owned);

  const lifecycleRef = useRef<Optional<ProvisionLifecycle>>(null);
  const latestManagedSourceRef = useRef<Optional<CreateContainerOptions>>(null);

  const [state, setState] = useState<Optional<ContainerProviderState>>(() =>
    source instanceof Container
      ? null
      : {
          container: createContainer({ ...source, activate: source.activate ?? true }),
          source: source,
        }
  );

  const managedSource: Optional<CreateContainerOptions> = owned ? (source as CreateContainerOptions) : null;
  const needsReplacement: boolean =
    state !== null &&
    managedSource !== null &&
    (state.source.parent !== managedSource?.parent ||
      !shallowEqualArrays(state.source.entries ?? [], managedSource.entries ?? []));

  latestManagedSourceRef.current = managedSource;

  useEffect(() => {
    if (!owned || state === null) {
      return;
    }

    const lifecycle: ProvisionLifecycle = (lifecycleRef.current ??= {
      pendingDestruction: new Map(),
      provisionedServices: new Map(),
    } as ProvisionLifecycle);

    retainContainer(state.container, lifecycle);

    if (needsReplacement) {
      const nextSource: CreateContainerOptions = latestManagedSourceRef.current!;

      setState({
        container: createContainer({ ...nextSource, activate: nextSource.activate ?? true }),
        source: nextSource,
      });
    } else {
      provisionContainer(state.container, lifecycle, state.source.entries);
    }

    return () => scheduleContainerDestruction(state.container, lifecycle);
  }, [needsReplacement, owned, state]);

  if (ownedRef.current !== owned) {
    throw new WirestateError(
      ERROR_CODE_VALIDATION_ERROR,
      "ContainerProvider cannot switch between external and managed container modes. Pass a React key to remount the provider."
    );
  }

  return createElement(
    ContainerReactContext.Provider,
    { value: owned ? (state as ContainerProviderState).container : (source as Container) },
    props.children ?? null
  );
}
