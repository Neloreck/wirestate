import { Container } from "inversify";
import { createElement, type FC, type ReactNode, useMemo, useState } from "react";

import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { ERROR_CODE_FAILED_TO_RESOLVE } from "@/wirestate/core/error/error-code";
import { WirestateError } from "@/wirestate/core/error/wirestate-error";
import { type IIocContext, IocContext } from "@/wirestate/core/provision/ioc-context";
import type { Optional } from "@/wirestate/types/general";

/**
 * Props for {@link IocProvider}.
 */
export interface IIocProviderProps {
  /**
   * External container instance. If omitted, a new container is created.
   */
  readonly container?: Container;
  /**
   * Components to wrap.
   */
  readonly children: ReactNode;
}

/**
 * Provides an IoC container to the component tree.
 *
 * @param props - component props
 * @param props.container - external container instance
 * @param props.children - components to wrap
 * @returns provider element
 */
export const IocProvider: FC<IIocProviderProps> = ({ container: externalContainer, children }) => {
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

  return createElement(IocContext.Provider, { value }, children);
};
