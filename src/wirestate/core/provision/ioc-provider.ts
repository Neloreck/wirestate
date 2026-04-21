import { Container } from "inversify";
import { createElement, PropsWithChildren, useEffect, useMemo, useState } from "react";

import { applySharedSeed } from "@/wirestate/core/container/apply-shared-seed";
import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { ERROR_CODE_FAILED_TO_RESOLVE } from "@/wirestate/core/error/error-code";
import { WirestateError } from "@/wirestate/core/error/wirestate-error";
import { type IIocContext, IocContext } from "@/wirestate/core/provision/ioc-context";
import type { Optional, TAnyObject } from "@/wirestate/types/general";

/**
 * Props for {@link IocProvider}.
 */
export interface IIocProviderProps extends PropsWithChildren<unknown> {
  /**
   * External container instance. If omitted, a new container is created.
   */
  readonly container?: Container;
  /**
   * Shared seed for the container.
   */
  readonly seed?: TAnyObject;
}

/**
 * Provides an IoC container to the component tree.
 *
 * @param props - component props
 * @param props.container - external container instance
 * @param props.seed - shared seed across the container
 * @param props.children - components to wrap
 * @returns provider element
 */
export function IocProvider({ container: externalContainer, seed, children }: IIocProviderProps) {
  // Incremented on binding changes to invalidate descendant caches (e.g., useInjection).
  const [revision, setRevision] = useState<number>(0);
  // Lazy initialize owned container if no external container is provided.
  const [ownedContainer] = useState<Optional<Container>>(() => (externalContainer ? null : createIocContainer()));

  const container = externalContainer ?? ownedContainer;

  if (!container) {
    throw new WirestateError(ERROR_CODE_FAILED_TO_RESOLVE, "[ioc] IocProvider failed to resolve a container instance.");
  }

  // Context value is stable unless the container or revision changes.
  const value: IIocContext = useMemo<IIocContext>(() => ({ container, revision, setRevision }), [container, revision]);

  useEffect(() => {
    if (seed) {
      applySharedSeed(container, seed);
    }
  }, [container]);

  return createElement(IocContext.Provider, { value }, children);
}
