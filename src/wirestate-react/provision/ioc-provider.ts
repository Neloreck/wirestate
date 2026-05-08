import { Container, applySharedSeed, createIocContainer, WirestateError } from "@wirestate/core";
import { createElement, PropsWithChildren, useEffect, useMemo, useState } from "react";

import { ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER } from "@/wirestate-react/error/error-code";
import { type IIocContext, IocContext } from "@/wirestate-react/provision/ioc-context";

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
  readonly seed?: Record<string, unknown>;
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
  const [revision, setRevision] = useState<number>(1);
  // Lazy initialize owned container if no external container is provided.
  const [ownedContainer] = useState<Container | null>(() => (externalContainer ? null : createIocContainer()));

  const container = externalContainer ?? ownedContainer;

  if (!container) {
    throw new WirestateError(
      ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER,
      "IocProvider failed to resolve a container instance."
    );
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
