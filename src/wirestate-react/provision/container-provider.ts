import { Container, ContainerConfig, WirestateError } from "@wirestate/core";
import { createElement, ReactNode, useEffect, useRef, useState } from "react";

import { ContainerContext } from "../context/container-context";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { Maybe, Optional } from "../types/general";
import { shallowEqualActivation, shallowEqualArrays } from "../utils/shallow-equal";

import { ReactContainerProvisionLifecycle, retainContainer, scheduleContainerDestruction } from "./provision-lifecycle";

/**
 * Provider messaging scope modes.
 *
 * @group Provision
 */
export enum ContainerProviderScope {
  /**
   * Create container-local message buses for managed containers.
   */
  Container = "container",

  /**
   * Inherit message buses from the managed container's parent.
   */
  Parent = "parent",
}

/**
 * String value accepted by {@link ContainerProviderProps.scope}.
 *
 * @group Provision
 */
export type ContainerProviderScopeValue = `${ContainerProviderScope}`;

/**
 * Describes props for {@link ContainerProvider}.
 *
 * @remarks
 * Pass either `container` or `config`. Passing both is an error.
 *
 * @group Provision
 */
export interface ContainerProviderProps {
  /**
   * External container instance to provide as-is.
   *
   * @remarks
   * External container instances are provisioned by this provider, but never
   * disposed.
   */
  readonly container?: Container;

  /**
   * Managed container creation options.
   *
   * @remarks
   * Managed containers created from config are disposed on unmount and activate
   * all bindings by default unless `activate` is provided explicitly. Managed
   * containers are recreated when the normalized config changes by shallow
   * comparison.
   */
  readonly config?: ContainerConfig;

  /**
   * Managed container messaging scope.
   *
   * @remarks
   * Defaults to `"container"`. Pass `"parent"` with a parent container in
   * `config.parent` to inherit the parent's `EventBus`, `CommandBus`, and
   * `QueryBus`.
   */
  readonly scope?: Maybe<ContainerProviderScopeValue>;

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
  readonly scope: Maybe<ContainerProviderScopeValue>;
  readonly source: ContainerConfig;
}

/**
 * Captures a provider provision failure so it can be thrown from render.
 */
interface ContainerProvisionError {
  readonly error: unknown;
}

/**
 * Provides a root Wirestate container to a React subtree.
 *
 * @remarks
 * Two modes:
 *
 * - External `container`: passed through, provisioned, never disposed.
 * - Managed `config`: created by the provider, provisioned, disposed on unmount.
 *
 * Managed containers activate all bindings by default. Pass `activate: false`
 * to keep them lazy.
 *
 * @group Provision
 *
 * @param props - Provider props.
 * @returns React context provider for the active container.
 * @throws `WirestateError` if props are invalid or provider mode changes.
 *
 * @example
 * ```tsx
 * import { Injectable } from "@wirestate/core";
 * import { ContainerProvider } from "@wirestate/react";
 * import { useMemo } from "react";
 *
 * @Injectable()
 * class CounterService {}
 *
 * export function Application() {
 *   const config = useMemo(() => ({ bindings: [CounterService] }), []);
 *
 *   return (
 *     <ContainerProvider config={config}>
 *       <Counter />
 *     </ContainerProvider>
 *   );
 * }
 * ```
 */
export function ContainerProvider(props: ContainerProviderProps) {
  const configValue: unknown = props.config;
  const hasConfig: boolean = configValue !== undefined;
  const scope: Maybe<ContainerProviderScopeValue> = props.scope;

  if (hasConfig && (configValue === null || typeof configValue !== "object" || Array.isArray(configValue))) {
    throw new WirestateError(
      "ContainerProvider requires a valid container instance or creation config.",
      ERROR_CODE_VALIDATION_ERROR
    );
  } else if (!props.container && !hasConfig) {
    throw new WirestateError(
      "ContainerProvider requires a valid container instance or creation config.",
      ERROR_CODE_VALIDATION_ERROR
    );
  } else if (props.container && hasConfig) {
    throw new WirestateError(
      "ContainerProvider requires only container or valid config object to be provided.",
      ERROR_CODE_VALIDATION_ERROR
    );
  } else if (props.container !== undefined && !(props.container instanceof Container)) {
    throw new WirestateError(
      "ContainerProvider requires a valid container instance or creation config.",
      ERROR_CODE_VALIDATION_ERROR
    );
  }

  const managedSource: Maybe<ContainerConfig> = props.config;
  const externalContainer: Maybe<Container> = props.container;
  const owned: boolean = Boolean(managedSource);
  const ownedRef = useRef<boolean>(owned);

  const pendingDestructionRef = useRef<Optional<ReactContainerProvisionLifecycle>>(null);
  const normalizedSource: Maybe<ContainerConfig> = managedSource
    ? { ...managedSource, activate: managedSource.activate ?? true }
    : null;

  const [error, setError] = useState<Optional<ContainerProvisionError>>(null);
  const [state, setState] = useState<Optional<ContainerProviderState>>(() =>
    normalizedSource
      ? {
          container: new Container(normalizedSource, { skipMessaging: scope === ContainerProviderScope.Parent }),
          scope,
          source: normalizedSource,
        }
      : null
  );

  if (ownedRef.current !== owned) {
    throw new WirestateError(
      "ContainerProvider cannot switch between external and managed container modes. Pass a React key to remount the provider.",
      ERROR_CODE_VALIDATION_ERROR
    );
  }

  const needsReplacement: boolean = Boolean(
    state &&
    normalizedSource &&
    (state.scope !== scope ||
      state.source.parent !== normalizedSource.parent ||
      state.source.onError !== normalizedSource.onError ||
      !shallowEqualArrays(state.source.bindings, normalizedSource.bindings) ||
      !shallowEqualActivation(state.source.activate, normalizedSource.activate))
  );

  let activeState: Optional<ContainerProviderState> = state;

  if (needsReplacement && normalizedSource) {
    activeState = {
      container: new Container(normalizedSource, { skipMessaging: scope === ContainerProviderScope.Parent }),
      scope,
      source: normalizedSource,
    };

    setState(activeState);
  }

  const activeContainer: Container = activeState ? activeState.container : (externalContainer as Container);

  useEffect(() => {
    const pendingDestruction: ReactContainerProvisionLifecycle = (pendingDestructionRef.current ??= new Map());

    retainContainer(activeContainer, pendingDestruction);

    try {
      activeContainer.provision();
    } catch (error) {
      if (owned) {
        scheduleContainerDestruction(activeContainer, pendingDestruction);
      } else {
        // Expect container to be deprovisioned by this moment, but leaving deprovision as explicit operation.
        activeContainer.deprovision();
      }

      setError({ error });

      return;
    }

    return () => {
      if (owned) {
        scheduleContainerDestruction(activeContainer, pendingDestruction);
      } else {
        activeContainer.deprovision();
      }
    };
  }, [activeContainer, owned]);

  if (error) {
    throw error.error;
  }

  return createElement(ContainerContext.Provider, { value: activeContainer }, props.children ?? null);
}
